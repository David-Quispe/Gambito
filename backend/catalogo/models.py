from django.db import models


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

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.nombre
