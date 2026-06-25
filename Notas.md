Bien, a continuación algunas notas sobre modificaciones que tenemos que hacer.

- En el menu principal de Produccion de Alimentos me gustaria que el orden de la galeria sea:
1. Preparar cama
2. Siembra
3. Aplicar insumos
4. Mantenimiento
5. Disponibilidad
6. Cosecha

En Registrar Siembra:
- Es importante registrar el area productiva y la cama, no solo la cama.
- Si se va a sembrar algun cultivo que no esté aún en la lista, debe de haber una opción para ingresar un nuevo cultivo (por lo menos el nombre, los detalles se pueden llenar luego)
- Debe de haber un campo para anotar quién fue el responsable de la siembra (si fueron varios, se debe de agregar el nombre de todos los participantes)
- Debe de haber un campo que permita escoger si fue de semilla, estaca o de almácigo (transplante)
- Sólo quiero corrobar que se genera un ID para ese lote de plantas una vez que se llena el Registro de Siembra. Este ID es lo que nos permite trackear ese lote a lo largo de todo el proceso, hasta la cosecha y entrega al cliente final.

En Preparar Cama:
- Debe de haber un campo para seleccionar el área productiva antes de la cama
- Me gusta la opción para agregar bioinsumos utilizados
- Debe de haber un campo para seleccionar las personas involucradas en el proceso
- Se me ocurre que a veces se van a preparar más de una cama, así que sería genial tener la opción de agregar otra cama en el mismo registro

En Mantenimiento de Área:
- Hay actividades que se hacen en un área entera (por ejemplo chapeas y algunos riegos) y otras que se hacen por cama (desmalezado, aplicación de mulch, tutoreado de tomate o enredaderas, etc.). Debemos tener la opción de escoger si la actividad es de un área entera o de una cama individual. También pasa que a veces se está desmalezando una cama y no da tiempo de terminar toda la cama, por lo que es importante poder registrar si se terminó la tarea completa o si quedó una parte pendiente.
- La actividad control de plagas debería de ir en aplicación de bioinsumos, no en acitivades de  mantenimiento
- Debemos agregar un campo para anotar los participantes de la actividad

En Aplicar Insumos:
- Debemos tener la opción (no obligatoria) de escoger una cama indiviudal en caso de que no se haya aplicado el insumo en toda el área productiva. Se me ocurre que una opción es que haya un botón que permita escoger si el insumo se aplicó en toda el área o en sólo una o varias camas. Si el usuario escoge una o varias camas, entonces se desplega la opción de escoger en cuál/es camas se aplicaron.
- Aquí también debemos agregar un campo para registrar los participantes de la actividad. A veces es sólo una persona, a veces varias.

En Disponibilidad Semanal:
- Cuando dices "Fecha de relevamiento" a qué te refieres? La fecha en la que se hizo la lista de la disponibilidad?
- Al escoger los cultivos disponibles, debería de tener campos para escoger el área productiva y la cama en la que se encuentra el cultivo. Esto automáticamente nos va a decir a que ID de lote corresponde ese cultivo (el que se activó en el momento de la siembra - no es necesario hacer esto visible en el app, sólo que quede el registro para trazabilidad luego)
- Lo ideal es tener estandarizado la unidad de cosecha para cada cultivo. Así que, cuando el usuario escoge el cultivo, automáticamente se debería de ver la unidad de cosecha, para guiar al usuario al llenar la cantidad (a veces uno no recuerde si ese cultivo en particular se registra en rollos o en g, por ejemplo)
- Importante tener un campo para registrar quién hizo la disponibilidad. 

Registrar Cosecha:
- El flujo debe de ser así: se envía la disponibilidad -> la cocina hace su orden (hay tres cocinas, por lo que se hacen tres ordenes) -> las ordenes de la cocina se reflejan en el app para el usuario de finca -> el usuario cosecha en base a las órdenes de cocina -> el usuario lleva toda la cosecha al area de pesado y ahí hace el registro que se ve en el formulario actual de Registrar Cosecha. Lo que pienso es que esto se puede hacer de dos maneras: 1) un sétimo botón en la galería de Producción de Alimentos que permita ver las órdenes que hizo la cocina para que el usuario de finca pueda llevarse esa lista al campo mientras hace la cosecha. Cuando ya cosechó toda la lista, se va al área de pesado y ahí llena el registro de "Registrar Cosecha". 2) Dentro del Registro de Cosecha, el usuario puede ver la órden de la cocina por cultivo y tiene un segundo campo para ingresar lo que realmente se cosechó (a veces no coinciden porque se estimó mal en la disponibilidad, o algo pasó y había más o menos de lo esperado). También puede pasar que se decidió cosechar cultivos que la cocina no había ordenado, por lo que tendría que haber la opción de agregar estos registros.
- A la hora de registrar el cultivo cosechado es importante escoger el área productiva y la cama de donde salió el cultivo, para mantener la trazabilidad. Puede que haya un mismo cultivo en dos camas diferentes de una misma área. Pero como el usuario no registra la cosecha en campo, si no en el área de pesado, puede pasar que haya cosechado un mismo cultivo de dos camas o áreas diferentes, y a la hora de pesar no sabe cuánto salió de qué área. No tengo claro cómo resolver esto. Quizás lo mejor es que se utilice una o varias canastas por área. Qué piensas?
- Al igual que en la Disponibilidad, la unidad de cosecha debería de ser llenada automáticamente al escoger el cultivo, a partir de los parámetros pre-establecidos en la tabla que contiene todos los cultivos.
- La tabla que contiene todos los cultivos y los parámetros predeterminados debe de tener una columna con el precio por unidad (editable por los usuarios admin). Este parámetro nos permite calcular el valor cosechado por cultivo, el valor de la cosecha total y realizar la factura interna que se le enviará automáticamente a la cocina y a los usuarios admin de Finca. 

Haz los cambios mencionados y ayúdame a definir aquello que no me queda tan claro.



En Registrar Siembra:
- En el campo de participantes, en vez de escribir los nombres lo mejor sería tener un "dropdown" que me permita escoger uno o varios nombres de una lista predeterminada. Quizás tengamos que crear una nueva tabla en la base de datos para esto. Lo mismo debe aplicar a los campos de participantes en los otros formularios de registro

En Aplicar Insumos:
- A la hora de agregar la cantidad de un producto, deberíamos de registrar la cantidad de ingrediente activo o la cantidad de bombas y el porcentaje de dilución? Pregunta para Tomas

En Registrar Cosecha:
- Veo que separaste el registro por canastas. Eso está bien. Pero en vez de separarlo por canastas, me gustaría separarlo por área productiva. Es decir, cada registro debe de llevar un campo para registrar área y otro para registrar cama. El tema de las canastas de maneja operativamente en campo fuera del app. 


Agregar opcion para cambiar contraseña, se le olvido la contraseña

Opcion de agregar un nuevo cultivo y editar los que ya existen (cambiar precio o unidad de medida por ejemplo), igual con los bioinsumos. Para esto, debería de agregar módulos extra para usuarios Admin.

Agregar un modulo que me permita ver las ventas - filtrable por internas vs externas, cliente, producto, vivero vs biofabrica, etc.




