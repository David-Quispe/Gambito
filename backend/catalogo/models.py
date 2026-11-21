from decimal import Decimal, ROUND_HALF_UP

from django.core.validators import MaxValueValidator
from django.db import models

# Desde esta cantidad hacia abajo se avisa "últimas unidades"
STOCK_BAJO = 3

# Tipos de producto que vende la tienda (todo lo que no es juego es "extra")
TIPOS = [
    ('juego', 'Juegos'),
    ('miniatura', 'Miniaturas'),
    ('pintura', 'Pinturas'),
    ('micas', 'Micas y fundas'),
    ('peluche', 'Peluches'),
    ('recuerdo', 'Recuerdos'),
    ('dado', 'Dados'),
]

DIFICULTADES = [
    ('facil', 'Fácil'),
    ('media', 'Media'),
    ('dificil', 'Difícil'),
]


class Categoria(models.Model):
    nombre = models.CharField(max_length=60, unique=True)
    descripcion = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = 'categorías'
        ordering = ['id']

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=8, decimal_places=2)
    imagen = models.CharField(
        max_length=500, blank=True,
        help_text='Enlace https://... o ruta como /accesorios/dado.jpg (vacío = ilustración según el tipo)',
    )
    stock = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.CASCADE, related_name='productos'
    )
    tipo = models.CharField(max_length=15, choices=TIPOS, default='juego')
    # Solo aplican a los juegos: en miniaturas, pinturas, dados, etc. se dejan vacíos
    jugadores = models.CharField(max_length=20, blank=True, help_text='Ej: 3-4')
    duracion = models.CharField(max_length=20, blank=True, help_text='Ej: 60-120 (minutos)')
    edad = models.CharField(max_length=10, blank=True, help_text='Ej: +10')
    # Información ampliada (solo juegos). En los textos largos, cada línea es un paso o un punto.
    dificultad = models.CharField(max_length=10, choices=DIFICULTADES, blank=True)
    componentes = models.TextField(blank=True, help_text='Qué trae la caja, una cosa por línea')
    preparacion = models.TextField(blank=True, help_text='Cómo se arma la mesa, un paso por línea')
    como_jugar = models.TextField(blank=True, help_text='Cómo se juega un turno, un paso por línea')
    como_ganar = models.TextField(blank=True, help_text='Cómo termina la partida y quién gana')
    consejos = models.TextField(blank=True, help_text='Trucos para la primera partida, uno por línea')
    video = models.CharField(
        max_length=200, blank=True,
        help_text='Enlace de YouTube que explica el juego (https://www.youtube.com/watch?v=...)',
    )
    # Marketing: porcentaje de descuento (0 = sin promoción)
    descuento = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(90)],
        help_text='Porcentaje de descuento, de 0 a 90',
    )
    # Unidades vendidas: sirve para ordenar y para recomendar los más populares
    ventas = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.nombre

    @property
    def en_oferta(self):
        return self.descuento > 0

    @property
    def precio_final(self):
        """Precio con el descuento ya aplicado, redondeado a céntimos."""
        final = self.precio * (Decimal(100) - self.descuento) / Decimal(100)
        return final.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @property
    def stock_bajo(self):
        return 0 < self.stock <= STOCK_BAJO
