# Gambito - Tienda virtual de juegos de mesa

Laboratorio GLAB-S13 de TECSUP (Diseño y Desarrollo de Software, IV ciclo). Es la base de una tienda virtual de juegos de mesa de Arequipa: el catálogo se muestra con ReactJS y los datos los entrega una API REST hecha con Django.

Autor: David Josué Quispe Ayamamani

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
python manage.py cargar_datos    # carga las categorías y los 16 juegos de ejemplo
python manage.py createsuperuser # para entrar al panel de administración
python manage.py runserver
```

El servidor queda en http://127.0.0.1:8000 y el panel de administración en `/admin/`.

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

## Notas

- Las portadas de los juegos se cargan desde BoardGameGeek, así que hace falta conexión a internet. Si una imagen no carga, se muestra una ilustración local de respaldo.
- Esta es solo la estructura inicial. El carrito, los pedidos, el registro de clientes y los pagos quedan para las siguientes sesiones.
