from rest_framework import serializers

from .models import Categoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']


class ProductoSerializer(serializers.ModelSerializer):
    # El frontend recibe el nombre de la categoría como texto
    categoria = serializers.CharField(source='categoria.nombre', read_only=True)
    precio = serializers.FloatField()
    precio_final = serializers.FloatField(read_only=True)
    en_oferta = serializers.BooleanField(read_only=True)
    stock_bajo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Producto
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'descuento', 'precio_final',
            'en_oferta', 'imagen', 'categoria', 'stock', 'stock_bajo', 'ventas',
            'jugadores', 'duracion', 'edad',
        ]
