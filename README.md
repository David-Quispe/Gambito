# Gambito - Tienda virtual de juegos de mesa

Laboratorios GLAB-S13 y GLAB-S14 de TECSUP (Diseño y Desarrollo de Software, IV ciclo). Es una tienda virtual de juegos de mesa de Arequipa: el catálogo se muestra con ReactJS y los datos los entrega una API REST hecha con Django. En el Lab 14 se agregaron diseño responsivo, búsqueda y filtros, promociones, inventario y recomendaciones.

Autor: David Josué Quispe Ayamamani

## Qué hace la tienda (Lab 14)

- **Objetivo:** vender juegos de mesa en línea a jugadores y familias de Arequipa, con un catálogo fácil de recorrer y precios claros.
- **Público objetivo:** familias, grupos de amigos y jugadores que empiezan o ya coleccionan juegos, y que compran desde el celular o la computadora.
- **Responsivo:** menú desplegable en celular, filtros plegables, tarjetas y tablas que se adaptan al ancho de la pantalla.
- **Búsqueda y filtros:** por nombre o descripción, categoría, precio máximo, solo ofertas y solo con stock; se puede ordenar por precio, descuento, más vendidos o nombre.
- **Marketing:** descuentos por producto (precio anterior tachado y etiqueta de porcentaje), franja de promociones con acceso directo a las ofertas y sección de recomendados.
- **Cuentas:** cualquier persona puede registrarse (usuario, correo y contraseña) o iniciar sesión con su usuario o su correo. Las cuentas nuevas son de **comprador**; el administrador se crea aparte y nunca desde el registro público.
- **Inventario:** solo lo ve y lo modifica el administrador. Al iniciar sesión como administrador aparece el botón "Inventario" con el resumen (agotados, stock bajo, valor en tienda) y botones +/− para cada juego. También se puede gestionar desde `/admin/` de Django. Los compradores solo ven el stock en la tienda: "¡Últimas N!" con 3 unidades o menos y "Agotado" en 0. El backend comprueba el permiso en cada cambio, aunque alguien intente llamar a la API directamente.
- **Recomendaciones:** al abrir un juego se muestran 4 parecidos. El backend da puntos por misma categoría, precio cercano, misma edad, popularidad y oferta, y descarta los agotados.

## Tecnologías

- **Frontend:** ReactJS 19, TypeScript, Vite, Tailwind CSS v4 y shadcn/ui
- **Backend:** Django, Django REST Framework y django-cors-headers
- **Base de datos:** SQLite (la que trae Django por defecto)

## Estructura

```
Gambito/
├── backend/
│   ├── config/        configuración de Django
│   └── catalogo/      modelos, serializadores, vistas y rutas de la API
└── frontend/
    └── src/
        ├── components/  Header, Hero, ProductCard, ProductList, CategoryFilter...
        ├── pages/
        ├── services/    llamadas a la API (api.ts)
        ├── types/       tipos de TypeScript
        └── lib/
```

## Cómo ejecutarlo

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # en Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py cargar_datos    # carga las categorías, los 16 juegos, descuentos y ventas de ejemplo
python manage.py crear_admin --password TU_CLAVE   # crea la cuenta de administrador (usuario admin)
python manage.py runserver
```

El servidor queda en http://127.0.0.1:8000 y el panel de administración en `/admin/`. `crear_admin` acepta también `--username` y `--email`; la contraseña no está en el código a propósito.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La tienda queda en http://localhost:5173. Para que cargue el catálogo, el backend tiene que estar encendido.

## Endpoints de la API

| Ruta | Descripción |
| --- | --- |
| `/api/categorias/` | Lista de categorías |
| `/api/productos/` | Lista de juegos |
| `/api/productos/?categoria=Cartas` | Juegos de una categoría |
| `/api/productos/<id>/` | Detalle de un juego |
| `/api/productos/?buscar=cat&precio_max=150&oferta=1&disponible=1&orden=precio_asc` | Búsqueda y filtros combinables. Órdenes: `populares`, `precio_asc`, `precio_desc`, `descuento`, `nombre` |
| `/api/productos/recomendados/` | Los 4 juegos más vendidos con stock |
| `/api/productos/<id>/recomendaciones/` | 4 juegos parecidos al indicado |
| `POST /api/auth/registro/` | Crea una cuenta de comprador. Cuerpo: `username`, `email`, `password` |
| `POST /api/auth/login/` | Inicia sesión. Cuerpo: `identificador` (usuario o correo) y `password`. Devuelve un token |
| `GET /api/auth/yo/` | Datos de la cuenta conectada (cabecera `Authorization: Token ...`) |
| `POST /api/auth/logout/` | Cierra la sesión y borra el token |
| `/api/productos/inventario/` | Resumen del inventario (solo administradores) |
| `POST /api/productos/<id>/ajustar-stock/` | Suma o resta unidades (solo administradores). Cuerpo: `{"cantidad": 5}` o `{"cantidad": -2}` |

## Pruebas

```bash
cd backend
python manage.py test
```

## Notas

- Las portadas de los juegos se cargan desde BoardGameGeek, así que hace falta conexión a internet. Si una imagen no carga, se muestra una ilustración local de respaldo.
- El carrito, los pedidos, el registro de clientes y los pagos quedan para las siguientes sesiones. Cuando exista el carrito, el stock se descontará al confirmar la compra.
