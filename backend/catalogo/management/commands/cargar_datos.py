from django.core.management.base import BaseCommand

from catalogo.models import Categoria, Producto

CATEGORIAS = {
    "Estrategia": "Juegos de planificación y decisiones",
    "Familiares": "Para jugar en familia o con amigos",
    "Cartas": "Partidas rápidas con mazos",
    "Party": "Diversión para grupos grandes",
    "Cooperativos": "Todos juegan en el mismo equipo"
}

PRODUCTOS = [
    {
        "nombre": "Catan",
        "descripcion": "Construye caminos y poblados, comercia recursos y conquista la isla antes que tus rivales.",
        "imagen": "https://cf.geekdo-images.com/0XODRpReiZBFUffEcqT5-Q__original/img/oRc0AomWA9ZtFqQDZiZbIyKE1j0=/0x0/filters:format(png)/pic9156909.png",
        "categoria": "Estrategia",
        "jugadores": "3-4",
        "duracion": "60-120",
        "edad": "+10",
        "precio": 189.9,
        "stock": 8
    },
    {
        "nombre": "Carcassonne",
        "descripcion": "Coloca losetas, arma el paisaje medieval y reparte a tus seguidores por caminos y castillos.",
        "imagen": "https://cf.geekdo-images.com/peUgu3A20LRmAXAMyDQfpQ__original/img/bP18m_PYjyFOv1IBGgMOteQUneA=/0x0/filters:format(jpeg)/pic8621446.jpg",
        "categoria": "Estrategia",
        "jugadores": "2-5",
        "duracion": "30-45",
        "edad": "+7",
        "precio": 129.9,
        "stock": 12
    },
    {
        "nombre": "Root",
        "descripcion": "Una guerra por el control del bosque, donde cada facción de animales juega con reglas distintas.",
        "imagen": "https://cf.geekdo-images.com/JUAUWaVUzeBgzirhZNmHHw__previewthumb/img/I5RKaHR2dTF0AYXonk-0mSTRi6E=/fit-in/300x320/filters:strip_icc()/pic4254509.jpg",
        "categoria": "Estrategia",
        "jugadores": "2-4",
        "duracion": "60-90",
        "edad": "+10",
        "precio": 259.9,
        "stock": 3
    },
    {
        "nombre": "Terraforming Mars",
        "descripcion": "Dirige una corporación y transforma Marte en un planeta habitable, proyecto a proyecto.",
        "imagen": "https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__original/img/thIqWDnH9utKuoKVEUqveDixprI=/0x0/filters:format(jpeg)/pic3536616.jpg",
        "categoria": "Estrategia",
        "jugadores": "1-5",
        "duracion": "120",
        "edad": "+12",
        "precio": 239.9,
        "stock": 5
    },
    {
        "nombre": "7 Wonders",
        "descripcion": "Levanta una gran civilización a lo largo de tres eras y deja tu maravilla en la historia.",
        "imagen": "https://cf.geekdo-images.com/35h9Za_JvMMMtx_92kT0Jg__original/img/jt70jJDZ1y1FWJs4ZQf5FI8APVY=/0x0/filters:format(jpeg)/pic7149798.jpg",
        "categoria": "Estrategia",
        "jugadores": "2-7",
        "duracion": "30",
        "edad": "+10",
        "precio": 179.9,
        "stock": 6
    },
    {
        "nombre": "Ticket to Ride",
        "descripcion": "Conecta ciudades con tus vagones y completa las rutas más largas del mapa.",
        "imagen": "https://cf.geekdo-images.com/kdWYkW-7AqG63HhqPL6ekA__original/img/rWF8r4JXXCQQ7QhiWHhmT-rQ3Pc=/0x0/filters:format(jpeg)/pic8937637.jpg",
        "categoria": "Familiares",
        "jugadores": "2-5",
        "duracion": "30-60",
        "edad": "+8",
        "precio": 199.9,
        "stock": 7
    },
    {
        "nombre": "Azul",
        "descripcion": "Decora el palacio con azulejos de colores. Fácil de aprender y muy difícil de dejar.",
        "imagen": "https://cf.geekdo-images.com/aPSHJO0d0XOpQR5X-wJonw__original/img/AkbtYVc6xXJF3c9EUrakklcclKw=/0x0/filters:format(png)/pic6973671.png",
        "categoria": "Familiares",
        "jugadores": "2-4",
        "duracion": "30-45",
        "edad": "+8",
        "precio": 149.9,
        "stock": 10
    },
    {
        "nombre": "Dixit",
        "descripcion": "Un juego de imaginación donde las ilustraciones cuentan historias y las pistas se vuelven poesía.",
        "imagen": "https://cf.geekdo-images.com/J0PlHArkZDJ57H-brXW2Fw__previewthumb/img/1vqdA41zdt6JR0ZgDdEuTXT23E8=/fit-in/300x320/filters:strip_icc()/pic6738336.jpg",
        "categoria": "Familiares",
        "jugadores": "3-6",
        "duracion": "30",
        "edad": "+8",
        "precio": 149.9,
        "stock": 9
    },
    {
        "nombre": "Wingspan",
        "descripcion": "Atrae aves a tu reserva natural y arma el mejor ecosistema, con huevos y todo.",
        "imagen": "https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/cI782Zis9cT66j2MjSHKJGnFPNw=/0x0/filters:format(jpeg)/pic4458123.jpg",
        "categoria": "Familiares",
        "jugadores": "1-5",
        "duracion": "40-70",
        "edad": "+10",
        "precio": 229.9,
        "stock": 4
    },
    {
        "nombre": "Uno",
        "descripcion": "El clásico de cartas para deshacerte de todas las tuyas antes que los demás.",
        "imagen": "https://cf.geekdo-images.com/-DHiHBBSnvaLu0Do8CIykQ__original/img/fRfoyWezpQsumExNKVxf1cwtJfg=/0x0/filters:format(jpeg)/pic8204165.jpg",
        "categoria": "Cartas",
        "jugadores": "2-10",
        "duracion": "30",
        "edad": "+7",
        "precio": 24.9,
        "stock": 40
    },
    {
        "nombre": "Exploding Kittens",
        "descripcion": "Gatos, bombas y mala suerte: sobrevive evitando sacar el gatito explosivo.",
        "imagen": "https://cf.geekdo-images.com/N8bL53-pRU7zaXDTrEaYrw__original/img/0ciN1VZYifUd0qIDO0e8cGXmiss=/0x0/filters:format(png)/pic2691976.png",
        "categoria": "Cartas",
        "jugadores": "2-5",
        "duracion": "15",
        "edad": "+7",
        "precio": 79.9,
        "stock": 0
    },
    {
        "nombre": "Love Letter",
        "descripcion": "Hazle llegar tu carta a la princesa en un duelo rápido de dieciséis cartas.",
        "imagen": "https://cf.geekdo-images.com/JT_06u5Eung6jueDM3kvpA__original/img/rJ0HXkjdU0SQr04kr0ZS_LI1h7U=/0x0/filters:format(jpeg)/pic9868049.jpg",
        "categoria": "Cartas",
        "jugadores": "2-4",
        "duracion": "20",
        "edad": "+10",
        "precio": 54.9,
        "stock": 15
    },
    {
        "nombre": "Dobble",
        "descripcion": "Encuentra el símbolo repetido antes que los demás. Cinco minutos y ya estás gritando.",
        "imagen": "https://cf.geekdo-images.com/hqDT4HbEb2eNCyMOeiGj-g__original/img/6w3wjI3YZOWa8XLxoKQqg3XnbN0=/0x0/filters:format(png)/pic6477003.png",
        "categoria": "Party",
        "jugadores": "2-8",
        "duracion": "15",
        "edad": "+6",
        "precio": 59.9,
        "stock": 18
    },
    {
        "nombre": "Codenames",
        "descripcion": "Dos equipos, un tablero de palabras y pistas de una sola palabra para encontrar a los agentes.",
        "imagen": "https://cf.geekdo-images.com/nC6ifPCDnAItwoKSKXVrnw__previewthumb/img/o4iHvfVWCLwbHRz9QJNz579a2_s=/fit-in/300x320/filters:strip_icc()/pic8907965.jpg",
        "categoria": "Party",
        "jugadores": "2-8",
        "duracion": "15",
        "edad": "+10",
        "precio": 109.9,
        "stock": 7
    },
    {
        "nombre": "Pandemic",
        "descripcion": "Trabajen juntos para frenar cuatro enfermedades antes de que se esparzan por el mundo.",
        "imagen": "https://cf.geekdo-images.com/S3ybV1LAp-8SnHIXLLjVqA__original/img/IsrvRLpUV1TEyZsO5rC-btXaPz0=/0x0/filters:format(jpeg)/pic1534148.jpg",
        "categoria": "Cooperativos",
        "jugadores": "2-4",
        "duracion": "45",
        "edad": "+8",
        "precio": 219.9,
        "stock": 4
    },
    {
        "nombre": "Forbidden Island",
        "descripcion": "Rescaten los tesoros de una isla que se hunde. Todos ganan o todos se mojan.",
        "imagen": "https://cf.geekdo-images.com/JgAkEBUaiHOsOS94iRMs2w__original/img/H5d4I5z_HSpPEu7EAl0DqLt9_pM=/0x0/filters:format(jpeg)/pic646458.jpg",
        "categoria": "Cooperativos",
        "jugadores": "2-4",
        "duracion": "30",
        "edad": "+10",
        "precio": 139.9,
        "stock": 6
    }
]


class Command(BaseCommand):
    help = 'Carga las categorías y los juegos de ejemplo de la tienda Gambito'

    def handle(self, *args, **options):
        for nombre, descripcion in CATEGORIAS.items():
            Categoria.objects.update_or_create(
                nombre=nombre, defaults={'descripcion': descripcion}
            )
        for datos in PRODUCTOS:
            datos = dict(datos)
            categoria = Categoria.objects.get(nombre=datos.pop('categoria'))
            Producto.objects.update_or_create(
                nombre=datos.pop('nombre'),
                defaults={**datos, 'categoria': categoria},
            )
        self.stdout.write(self.style.SUCCESS(
            f'Listo: {Categoria.objects.count()} categorías y {Producto.objects.count()} juegos.'
        ))
