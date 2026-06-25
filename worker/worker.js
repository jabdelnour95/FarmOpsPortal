/**
 * Tierramor API — Cloudflare Worker
 *
 * Proxy entre el frontend y Supabase/Google Drive.
 * Valida JWTs, oculta la service key, y aplica reglas de acceso por rol.
 *
 * Env secrets requeridos (wrangler secret put <NAME>):
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET,
 *   GOOGLE_DRIVE_SERVICE_ACCOUNT, GOOGLE_DRIVE_FOLDER_ID
 */

const ALLOWED_ORIGINS = [
  'https://jabdelnour95.github.io',
  'http://localhost:8080',
];

// ─── CORS ──────────────────────────────────────────────────────────────────

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// ─── RESPONSE HELPERS ──────────────────────────────────────────────────────

function jsonResponse(request, body, status = 200) {
  const origin = request.headers.get('Origin') || '';
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function okResponse(request, data, status = 200) {
  return jsonResponse(request, data, status);
}

function errResponse(request, code, message, status, details = null) {
  return jsonResponse(request, { error: { code, message, details } }, status);
}

// ─── JWT VALIDATION ────────────────────────────────────────────────────────

// Caché de JWKS en memoria del Worker (se invalida al redesplegar)
let cachedJwks = null;

async function fetchJwks(env) {
  if (cachedJwks) return cachedJwks;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
  cachedJwks = await res.json();
  return cachedJwks;
}

function b64urlToBytes(b64url) {
  return Uint8Array.from(atob(b64url.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

async function validateJWT(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, message: 'Token no proporcionado' };
  }

  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, message: 'Formato de token inválido' };

  const [headerB64, payloadB64, sigB64] = parts;

  try {
    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    const sig = b64urlToBytes(sigB64);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    let valid = false;

    if (header.alg === 'ES256') {
      // Supabase proyectos nuevos usan ES256 (ECDSA P-256)
      const jwks = await fetchJwks(env);
      const jwk = jwks.keys?.find(k => k.kid === header.kid);
      if (!jwk) return { ok: false, message: 'Clave de firma no encontrada (JWKS)' };
      const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      valid = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig, data);
    } else if (header.alg === 'HS256') {
      // Proyectos legacy usan HS256
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.SUPABASE_JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
      valid = await crypto.subtle.verify('HMAC', key, sig, data);
    } else {
      return { ok: false, message: `Algoritmo JWT no soportado: ${header.alg}` };
    }

    if (!valid) return { ok: false, message: 'Firma de token inválida' };

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, message: 'Token expirado. Por favor, iniciá sesión nuevamente.' };
    }

    // El JWT de Supabase tiene role="authenticated", no el rol de la app.
    // Fetcheamos el perfil para obtener el rol real (admin / field_worker / kitchen).
    const profileRes = await sbGet(env, 'profiles', `id=eq.${payload.sub}&select=role`);
    const profiles = await profileRes.json();
    const appRole = profiles[0]?.role ?? 'field_worker';

    return { ok: true, userId: payload.sub, email: payload.email, role: appRole };
  } catch {
    return { ok: false, message: 'Error al validar token' };
  }
}

// ─── SUPABASE HELPERS ──────────────────────────────────────────────────────

function sbHeaders(env) {
  return {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
  };
}

async function sbGet(env, path, params = '') {
  const qs = params ? `?${params}` : '';
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}${qs}`, {
    headers: sbHeaders(env),
  });
}

async function sbPost(env, path, body) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      ...sbHeaders(env),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
}

async function sbPatch(env, path, filter, body) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}?${filter}`, {
    method: 'PATCH',
    headers: {
      ...sbHeaders(env),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
}

async function sbDelete(env, path, filter) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}?${filter}`, {
    method: 'DELETE',
    headers: sbHeaders(env),
  });
}

async function sbAuthCall(env, endpoint, body) {
  return fetch(`${env.SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Proxy directo de una respuesta de Supabase al cliente.
async function proxySb(request, res) {
  const data = await res.json();
  if (!res.ok) {
    return errResponse(request, 'SUPABASE_ERROR', data.message || 'Error en base de datos', res.status, data);
  }
  return okResponse(request, data, res.status);
}

// ─── AUTH ──────────────────────────────────────────────────────────────────

async function handleAuth(request, env) {
  if (request.method !== 'POST') {
    return errResponse(request, 'METHOD_NOT_ALLOWED', 'Método no permitido', 405);
  }

  const url = new URL(request.url);
  const action = url.pathname.split('/').at(-1); // login | refresh | logout | reset-password
  const body = await request.json();

  if (action === 'login') {
    const res = await sbAuthCall(env, 'token?grant_type=password', {
      email: body.email,
      password: body.password,
    });
    const data = await res.json();
    if (!res.ok) return errResponse(request, 'UNAUTHORIZED', 'Credenciales inválidas', 401);

    const profileRes = await sbGet(
      env,
      'profiles',
      `id=eq.${data.user.id}&select=full_name,role,profile_departments(department)`,
    );
    const profiles = await profileRes.json();
    const profile = profiles[0];

    return okResponse(request, {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: {
          full_name: profile?.full_name,
          role: profile?.role,
          departments: profile?.profile_departments?.map(d => d.department) ?? [],
        },
      },
    });
  }

  if (action === 'refresh') {
    const res = await sbAuthCall(env, 'token?grant_type=refresh_token', {
      refresh_token: body.refresh_token,
    });
    const data = await res.json();
    if (!res.ok) return errResponse(request, 'UNAUTHORIZED', 'Refresh token inválido', 401);
    return okResponse(request, { access_token: data.access_token, refresh_token: data.refresh_token });
  }

  if (action === 'logout') {
    const authHeader = request.headers.get('Authorization') || '';
    await fetch(`${env.SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: authHeader },
    });
    return okResponse(request, { success: true });
  }

  if (action === 'reset-password') {
    const res = await sbAuthCall(env, 'recover', { email: body.email });
    if (!res.ok) return errResponse(request, 'ERROR', 'Error al enviar email de recuperación', 500);
    return okResponse(request, { success: true });
  }

  return errResponse(request, 'NOT_FOUND', 'Ruta de auth no encontrada', 404);
}

// ─── USERS (solo admin) ────────────────────────────────────────────────────

async function handleUsers(request, env, auth) {
  if (auth.role !== 'admin') {
    return errResponse(request, 'FORBIDDEN', 'Solo administradores pueden gestionar usuarios', 403);
  }

  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const userId = segments[2]; // undefined si es /api/users

  if (request.method === 'GET') {
    const res = await sbGet(
      env,
      'profiles',
      'select=*,profile_departments(department)&order=full_name.asc',
    );
    return proxySb(request, res);
  }

  if (request.method === 'POST') {
    const body = await request.json();

    // Crear usuario en Supabase Auth
    const createRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        ...sbHeaders(env),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: body.email, password: body.password, email_confirm: true }),
    });
    const userData = await createRes.json();
    if (!createRes.ok) return errResponse(request, 'ERROR', userData.message, createRes.status);

    // El trigger en Supabase crea el perfil con valores por defecto; lo actualizamos
    await sbPatch(env, 'profiles', `id=eq.${userData.user.id}`, {
      full_name: body.full_name,
      role: body.role,
    });

    if (body.departments?.length) {
      const rows = body.departments.map(d => ({ profile_id: userData.user.id, department: d }));
      await sbPost(env, 'profile_departments', rows);
    }

    return okResponse(request, { id: userData.user.id }, 201);
  }

  if (request.method === 'PATCH' && userId) {
    const body = await request.json();
    const { departments, ...profileFields } = body;

    if (Object.keys(profileFields).length) {
      await sbPatch(env, 'profiles', `id=eq.${userId}`, profileFields);
    }

    if (departments !== undefined) {
      await sbDelete(env, 'profile_departments', `profile_id=eq.${userId}`);
      if (departments.length) {
        const rows = departments.map(d => ({ profile_id: userId, department: d }));
        await sbPost(env, 'profile_departments', rows);
      }
    }

    return okResponse(request, { success: true });
  }

  return errResponse(request, 'METHOD_NOT_ALLOWED', 'Método no permitido', 405);
}

// ─── CATALOGS ──────────────────────────────────────────────────────────────

const CATALOG_TABLE = {
  areas: 'productive_areas',
  beds: 'beds',
  crops: 'crops',
  'bio-raw-materials': 'bio_raw_materials',
  'bio-finished-products': 'bio_finished_products',
  'nursery-species': 'nursery_species',
  'nursery-price-categories': 'nursery_price_categories',
  'nursery-raw-materials': 'nursery_raw_materials',
  'substrate-types': 'substrate_types',
  'container-types': 'container_types',
};

// Tables that don't have a 'name' column for ordering
const CATALOG_ORDER = {
  beds: 'code.asc',
};

async function handleCatalogs(request, env, auth) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  // segments: ['api', 'catalogs', ':resource', ':id?']
  const resource = segments[2];
  const itemId = segments[3];
  const table = CATALOG_TABLE[resource];

  if (!table) return errResponse(request, 'NOT_FOUND', 'Catálogo no encontrado', 404);

  if (request.method === 'GET') {
    const order = CATALOG_ORDER[resource] ?? 'name.asc';
    const res = await sbGet(env, table, `order=${order}`);
    return proxySb(request, res);
  }

  // Field workers can create new crops (but not edit or delete)
  if (auth.role !== 'admin') {
    if (request.method === 'POST' && resource === 'crops') {
      const res = await sbPost(env, table, await request.json());
      return proxySb(request, res);
    }
    return errResponse(request, 'FORBIDDEN', 'Solo admin puede modificar catálogos', 403);
  }

  if (request.method === 'POST') {
    const res = await sbPost(env, table, await request.json());
    return proxySb(request, res);
  }

  if (request.method === 'PATCH' && itemId) {
    const res = await sbPatch(env, table, `id=eq.${itemId}`, await request.json());
    return proxySb(request, res);
  }

  return errResponse(request, 'METHOD_NOT_ALLOWED', 'Método no permitido', 405);
}

// ─── FOOD PRODUCTION ───────────────────────────────────────────────────────

const FOOD_TABLE = {
  'planting-plans': 'planting_plans',
  'propagation-orders': 'propagation_orders',
  'area-maintenance': 'area_maintenance',
  harvests: 'harvests',
  invoices: 'internal_invoices_food',
  'kitchen-orders': 'kitchen_orders',
  availability: 'weekly_availability',
};

async function handleFood(request, env, auth) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  // segments: ['api', 'food', ':resource', ':id?', ':action?']
  const resource = segments[2];
  const itemId = segments[3];
  const action = segments[4];

  // ── bed-preparations (con array de inputs)
  if (resource === 'bed-preparations') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'bed_preparations', 'select=*,bed_preparation_inputs(*)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const { inputs = [], ...fields } = await request.json();
      const prepRes = await sbPost(env, 'bed_preparations', fields);
      if (!prepRes.ok) return proxySb(request, prepRes);
      const prep = (await prepRes.json())[0];
      if (inputs.length) {
        await sbPost(env, 'bed_preparation_inputs', inputs.map(i => ({ ...i, preparation_id: prep.id })));
      }
      return okResponse(request, prep, 201);
    }
  }

  // ── plantings (lot_id generado por trigger en DB)
  if (resource === 'plantings') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'plantings', 'select=*,crops(name),beds(code)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const res = await sbPost(env, 'plantings', await request.json());
      return proxySb(request, res);
    }
  }

  // ── input-applications (con array de items)
  if (resource === 'input-applications') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'input_applications', 'select=*,input_application_items(*)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const { items = [], ...fields } = await request.json();
      const appRes = await sbPost(env, 'input_applications', fields);
      if (!appRes.ok) return proxySb(request, appRes);
      const app = (await appRes.json())[0];
      if (items.length) {
        await sbPost(env, 'input_application_items', items.map(i => ({ ...i, application_id: app.id })));
      }
      return okResponse(request, app, 201);
    }
  }

  // ── availability/check (verificar si ya existe para una semana)
  if (resource === 'availability' && itemId === 'check' && request.method === 'POST') {
    const { week_ref } = await request.json();
    const res = await sbGet(env, 'weekly_availability', `week_ref=eq.${week_ref}&select=id,status`);
    const rows = await res.json();
    return okResponse(request, { exists: rows.length > 0, id: rows[0]?.id ?? null, status: rows[0]?.status ?? null });
  }

  // ── availability/:id/publish
  if (resource === 'availability' && action === 'publish' && request.method === 'PATCH') {
    const res = await sbPatch(env, 'weekly_availability', `id=eq.${itemId}`, { status: 'published' });
    return proxySb(request, res);
  }

  // ── kitchen-orders/:id/confirm
  if (resource === 'kitchen-orders' && action === 'confirm' && request.method === 'PATCH') {
    const res = await sbPatch(env, 'kitchen_orders', `id=eq.${itemId}`, { status: 'confirmed' });
    return proxySb(request, res);
  }

  // ── availability (create with items array) — must come before generic FOOD_TABLE handler
  if (resource === 'availability' && !itemId && request.method === 'POST') {
    const { items = [], ...fields } = await request.json();
    const availRes = await sbPost(env, 'weekly_availability', fields);
    if (!availRes.ok) return proxySb(request, availRes);
    const avail = (await availRes.json())[0];
    if (items.length) {
      await sbPost(env, 'weekly_availability_items', items.map(i => ({ ...i, availability_id: avail.id })));
    }
    return okResponse(request, avail, 201);
  }

  // ── recursos simples con GET/POST genérico
  const table = FOOD_TABLE[resource];
  if (table) {
    if (request.method === 'GET') {
      const res = await sbGet(env, table, 'order=created_at.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const res = await sbPost(env, table, await request.json());
      return proxySb(request, res);
    }
  }

  return errResponse(request, 'NOT_FOUND', 'Ruta no encontrada', 404);
}

// ─── BIOFACTORY ────────────────────────────────────────────────────────────

async function handleBio(request, env, auth) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const resource = segments[2];
  const itemId = segments[3];
  const action = segments[4];

  // ── raw-material-entries
  if (resource === 'raw-material-entries') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'bio_raw_material_entries', 'select=*,bio_raw_materials(name)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const res = await sbPost(env, 'bio_raw_material_entries', await request.json());
      return proxySb(request, res);
    }
  }

  // ── batches
  if (resource === 'batches') {
    if (!itemId) {
      if (request.method === 'GET') {
        const res = await sbGet(env, 'bio_production_batches', 'select=*,bio_production_batch_inputs(*)&order=date_start.desc');
        return proxySb(request, res);
      }
      if (request.method === 'POST') {
        const { inputs = [], ...fields } = await request.json();
        const batchRes = await sbPost(env, 'bio_production_batches', fields);
        if (!batchRes.ok) return proxySb(request, batchRes);
        const batch = (await batchRes.json())[0];
        if (inputs.length) {
          await sbPost(env, 'bio_production_batch_inputs', inputs.map(i => ({ ...i, batch_id: batch.id })));
        }
        return okResponse(request, batch, 201);
      }
    }

    // PATCH /api/bio/batches/:id/close — valida stock antes de cerrar (D-001)
    if (action === 'close' && request.method === 'PATCH') {
      const body = await request.json();

      const [inputsRes, ...stockRess] = await (async () => {
        const iRes = await sbGet(env, 'bio_production_batch_inputs', `batch_id=eq.${itemId}&select=raw_material_id,quantity`);
        const inputs = await iRes.json();
        const sRess = await Promise.all(
          inputs.map(i =>
            sbGet(env, 'v_bio_raw_material_stock', `id=eq.${i.raw_material_id}&select=id,name,current_stock`),
          ),
        );
        return [inputs, ...sRess];
      })();

      const stockRows = await Promise.all(stockRess.map(r => r.json()));

      const warnings = inputsRes
        .map((input, idx) => {
          const stock = stockRows[idx][0];
          if (stock && stock.current_stock < input.quantity) {
            return { raw_material_id: input.raw_material_id, name: stock.name, required: input.quantity, available: stock.current_stock };
          }
          return null;
        })
        .filter(Boolean);

      const closeRes = await sbPatch(env, 'bio_production_batches', `id=eq.${itemId}`, { ...body, status: 'closed' });
      if (!closeRes.ok) return proxySb(request, closeRes);

      return okResponse(request, {
        warning: warnings.length > 0,
        items: warnings,
        batch: (await closeRes.json())[0],
      });
    }
  }

  // ── outputs
  if (resource === 'outputs') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'bio_finished_product_outputs', 'select=*,bio_finished_products(name)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const res = await sbPost(env, 'bio_finished_product_outputs', await request.json());
      return proxySb(request, res);
    }
  }

  // ── invoices
  if (resource === 'invoices' && request.method === 'GET') {
    const res = await sbGet(env, 'bio_external_invoices', 'order=created_at.desc');
    return proxySb(request, res);
  }

  return errResponse(request, 'NOT_FOUND', 'Ruta no encontrada', 404);
}

// ─── NURSERY ───────────────────────────────────────────────────────────────

const NURSERY_LOT_SUB = {
  'germination-tracking': 'nursery_germination_tracking',
  'establishment-count': 'nursery_establishment_counts',
  maintenance: 'nursery_lot_maintenance',
  'plant-counts': 'nursery_plant_counts',
  graduations: 'nursery_graduations',
  outputs: 'nursery_lot_outputs',
};

async function handleNursery(request, env, auth) {
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);
  const resource = segments[2];
  const itemId = segments[3];
  const action = segments[4];

  // ── raw-material-entries
  if (resource === 'raw-material-entries') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'nursery_raw_material_entries', 'select=*,nursery_raw_materials(name)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const res = await sbPost(env, 'nursery_raw_material_entries', await request.json());
      return proxySb(request, res);
    }
  }

  // ── substrate-batches (con array de components)
  if (resource === 'substrate-batches') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'nursery_substrate_batches', 'select=*,nursery_substrate_batch_components(*)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const { components = [], ...fields } = await request.json();
      const batchRes = await sbPost(env, 'nursery_substrate_batches', fields);
      if (!batchRes.ok) return proxySb(request, batchRes);
      const batch = (await batchRes.json())[0];
      if (components.length) {
        await sbPost(env, 'nursery_substrate_batch_components', components.map(c => ({ ...c, batch_id: batch.id })));
      }
      return okResponse(request, batch, 201);
    }
  }

  // ── container-fills
  if (resource === 'container-fills') {
    if (request.method === 'GET') {
      const res = await sbGet(env, 'nursery_container_fills', 'select=*,container_types(name)&order=date.desc');
      return proxySb(request, res);
    }
    if (request.method === 'POST') {
      const res = await sbPost(env, 'nursery_container_fills', await request.json());
      return proxySb(request, res);
    }
  }

  // ── lots
  if (resource === 'lots') {
    // GET/POST /api/nursery/lots
    if (!itemId) {
      if (request.method === 'GET') {
        const res = await sbGet(env, 'nursery_lots', 'select=*,nursery_species(name),container_types(name)&order=date_started.desc');
        return proxySb(request, res);
      }
      if (request.method === 'POST') {
        const res = await sbPost(env, 'nursery_lots', await request.json());
        return proxySb(request, res);
      }
    }

    // GET /api/nursery/lots/:id — detalle completo
    if (itemId && !action && request.method === 'GET') {
      const [lotRes, germRes, estRes, maintRes, countRes, gradRes, outRes] = await Promise.all([
        sbGet(env, 'nursery_lots', `id=eq.${itemId}&select=*,nursery_species(*),container_types(*)`),
        sbGet(env, 'nursery_germination_tracking', `lot_id=eq.${itemId}&order=tracking_date.asc`),
        sbGet(env, 'nursery_establishment_counts', `lot_id=eq.${itemId}&limit=1`),
        sbGet(env, 'nursery_lot_maintenance', `lot_id=eq.${itemId}&order=date.desc`),
        sbGet(env, 'nursery_plant_counts', `lot_id=eq.${itemId}&order=count_date.desc`),
        sbGet(env, 'nursery_graduations', `lot_id=eq.${itemId}&order=graduation_date.desc`),
        sbGet(env, 'nursery_lot_outputs', `lot_id=eq.${itemId}&order=output_date.desc`),
      ]);

      const [lot, germination, establishment, maintenance, plant_counts, graduations, outputs] = await Promise.all([
        lotRes.json(),
        germRes.json(),
        estRes.json(),
        maintRes.json(),
        countRes.json(),
        gradRes.json(),
        outRes.json(),
      ]);

      return okResponse(request, {
        lot: lot[0] ?? null,
        germination_tracking: germination,
        establishment_count: establishment[0] ?? null,
        maintenance,
        plant_counts,
        graduations,
        outputs,
      });
    }

    // POST /api/nursery/lots/:id/:action — sub-recursos del lote
    if (itemId && action && request.method === 'POST') {
      const table = NURSERY_LOT_SUB[action];
      if (!table) return errResponse(request, 'NOT_FOUND', 'Sub-recurso de lote no encontrado', 404);
      const body = await request.json();
      const res = await sbPost(env, table, { ...body, lot_id: itemId });
      return proxySb(request, res);
    }
  }

  // ── quotations
  if (resource === 'quotations') {
    if (!itemId) {
      if (request.method === 'GET') {
        const res = await sbGet(env, 'nursery_quotations', 'select=*,nursery_quotation_items(*)&order=date.desc');
        return proxySb(request, res);
      }
      if (request.method === 'POST') {
        const res = await sbPost(env, 'nursery_quotations', await request.json());
        return proxySb(request, res);
      }
    }
    // PATCH /api/nursery/quotations/:id/status
    if (itemId && action === 'status' && request.method === 'PATCH') {
      const { status } = await request.json();
      const res = await sbPatch(env, 'nursery_quotations', `id=eq.${itemId}`, { status });
      return proxySb(request, res);
    }
  }

  return errResponse(request, 'NOT_FOUND', 'Ruta no encontrada', 404);
}

// ─── INVENTORY (vistas de stock) ───────────────────────────────────────────

const INVENTORY_VIEW = {
  'bio-raw': 'v_bio_raw_material_stock',
  'bio-finished': 'v_bio_finished_product_stock',
  substrates: 'v_nursery_substrate_stock',
  containers: 'v_nursery_container_stock',
  'nursery-raw': 'v_nursery_raw_material_stock',
};

async function handleInventory(request, env, auth) {
  if (request.method !== 'GET') {
    return errResponse(request, 'METHOD_NOT_ALLOWED', 'Método no permitido', 405);
  }
  const resource = new URL(request.url).pathname.split('/').filter(Boolean)[2];
  const view = INVENTORY_VIEW[resource];
  if (!view) return errResponse(request, 'NOT_FOUND', 'Vista de inventario no encontrada', 404);
  const res = await sbGet(env, view, 'order=name.asc');
  return proxySb(request, res);
}

// ─── FARM WORKERS ──────────────────────────────────────────────────────────

async function handleFarmWorkers(request, env, auth) {
  if (request.method !== 'GET') {
    return errResponse(request, 'METHOD_NOT_ALLOWED', 'Método no permitido', 405);
  }
  const res = await sbGet(env, 'farm_workers', 'active=eq.true&order=name.asc');
  return proxySb(request, res);
}

// ─── PHOTOS ────────────────────────────────────────────────────────────────

async function handlePhotos(request, env, auth) {
  if (request.method !== 'POST') {
    return errResponse(request, 'METHOD_NOT_ALLOWED', 'Método no permitido', 405);
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file) return errResponse(request, 'VALIDATION_ERROR', 'No se recibió ningún archivo', 400);

  const department = formData.get('department') ?? 'general';
  const recordType = formData.get('record_type') ?? 'photo';
  const recordDate = formData.get('record_date') ?? new Date().toISOString().slice(0, 10);
  const fileName = `${department}/${recordDate}/${recordType}-${Date.now()}.jpg`;

  // TODO: implementar upload a Google Drive usando service account
  // 1. Parsear JSON de env.GOOGLE_DRIVE_SERVICE_ACCOUNT
  // 2. Firmar JWT RS256 para OAuth2 (Web Crypto subtle.sign con RSASSA-PKCS1-v1_5)
  // 3. POST a https://oauth2.googleapis.com/token → access_token
  // 4. POST multipart a https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
  //    con parent folder env.GOOGLE_DRIVE_FOLDER_ID
  // 5. PATCH permisos del archivo a público (anyone, reader)
  // 6. Retornar { url: "https://drive.google.com/uc?id=..." }

  return errResponse(request, 'NOT_IMPLEMENTED', 'Upload de fotos pendiente (ver TODO en worker.js:handlePhotos)', 501);
}

// ─── ROUTER PRINCIPAL ──────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';

    // Preflight CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const { pathname } = new URL(request.url);

    // Rutas públicas (sin JWT)
    if (pathname.startsWith('/api/auth/')) return handleAuth(request, env);

    // Todas las demás rutas requieren JWT válido
    const auth = await validateJWT(request, env);
    if (!auth.ok) return errResponse(request, 'UNAUTHORIZED', auth.message, 401);

    if (pathname.startsWith('/api/users'))       return handleUsers(request, env, auth);
    if (pathname.startsWith('/api/catalogs/'))   return handleCatalogs(request, env, auth);
    if (pathname.startsWith('/api/food/'))       return handleFood(request, env, auth);
    if (pathname.startsWith('/api/bio/'))        return handleBio(request, env, auth);
    if (pathname.startsWith('/api/nursery/'))    return handleNursery(request, env, auth);
    if (pathname.startsWith('/api/inventory/'))  return handleInventory(request, env, auth);
    if (pathname === '/api/farm-workers')        return handleFarmWorkers(request, env, auth);
    if (pathname.startsWith('/api/photos/'))     return handlePhotos(request, env, auth);

    return errResponse(request, 'NOT_FOUND', 'Ruta no encontrada', 404);
  },
};
