from decimal import Decimal, ROUND_HALF_UP

from django.core.validators import MaxValueValidator
from django.db import models

# Desde esta cantidad hacia abajo se avisa "últimas unidades"
STOCK_BAJO = 3


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
    imagen = models.URLField(max_length=500, help_text='Enlace a la portada del juego')
    stock = models.PositiveIntegerField(default=0)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.CASCADE, related_name='productos'
    )
    jugadores = models.CharField(max_length=20, help_text='Ej: 3-4')
    duracion = models.CharField(max_length=20, help_text='Ej: 60-120 (minutos)')
    edad = models.CharField(max_length=10, help_text='Ej: +10')
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
