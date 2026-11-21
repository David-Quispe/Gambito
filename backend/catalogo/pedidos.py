"""Carrito → pedido: validación de stock, pago simulado y descuento de inventario.

El carrito vive en el navegador. Al pagar, el frontend envía los productos y las
cantidades; aquí se vuelven a comprobar precios y stock (nunca se confía en el
navegador) y todo se guarda en una sola transacción: si algo falla, no cambia nada.
"""
import uuid
from decimal import Decimal

from django.db import transaction
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import METODOS_PAGO, ItemPedido, Pedido, Producto

# Tarjeta de prueba: la que termina en 0002 siempre es rechazada (para probar el error)
TARJETA_RECHAZADA = '0002'


class ErrorDePedido(Exception):
    def __init__(self, cuerpo, codigo):
        super().__init__(cuerpo['detalle'])
        self.cuerpo = cuerpo
        self.codigo = codigo


class ItemEntrada(serializers.Serializer):
    producto = serializers.IntegerField(min_value=1)
    cantidad = serializers.IntegerField(min_value=1, max_value=20)


class PedidoEntrada(serializers.Serializer):
    items = serializers.ListField(child=ItemEntrada(), allow_empty=False, max_length=30)
    nombre = serializers.CharField(max_length=80)
    direccion = serializers.CharField(max_length=200)
    metodo = serializers.ChoiceField(choices=[m[0] for m in METODOS_PAGO])
    # Solo los 4 últimos dígitos: el número completo nunca sale del navegador
    tarjeta_final = serializers.RegexField(r'^\d{4}$', required=False, allow_blank=True)

    def validate(self, datos):
        if datos['metodo'] == 'tarjeta' and not datos.get('tarjeta_final'):
            raise serializers.ValidationError({'tarjeta_final': 'Escribe tu tarjeta de prueba.'})
        return datos


class ItemSalida(serializers.ModelSerializer):
    precio_unitario = serializers.FloatField()
    subtotal = serializers.FloatField()

    class Meta:
        model = ItemPedido
        fields = ['producto', 'nombre', 'precio_unitario', 'cantidad', 'subtotal']


class PedidoSerializer(serializers.ModelSerializer):
    items = ItemSalida(many=True, read_only=True)
    total = serializers.FloatField()
    estado_nombre = serializers.CharField(source='get_estado_display', read_only=True)
    metodo_nombre = serializers.CharField(source='get_metodo_pago_display', read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id', 'creado', 'estado', 'estado_nombre', 'metodo_pago', 'metodo_nombre',
            'referencia_pago', 'nombre_cliente', 'direccion', 'total', 'items',
        ]


def simular_pago(metodo, tarjeta_final):
    """Devuelve (estado, referencia). No hay pasarela real: todo es una simulación."""
    if metodo == 'tarjeta':
        if tarjeta_final == TARJETA_RECHAZADA:
            raise ErrorDePedido(
                {'detalle': 'El banco rechazó la tarjeta (es la tarjeta de prueba que siempre falla).'}, 402
            )
        return 'pagado', f'Tarjeta terminada en {tarjeta_final}'
    if metodo == 'yape':
        return 'pagado', f'Yape SIM-{uuid.uuid4().hex[:8].upper()}'
    return 'pendiente', 'Pago al recibir el pedido'


@transaction.atomic
def crear_pedido(usuario, datos):
    # Si el mismo producto viene dos veces, se suman las cantidades
    pedidas = {}
    for item in datos['items']:
        pedidas[item['producto']] = pedidas.get(item['producto'], 0) + item['cantidad']

    # select_for_update bloquea las filas: dos compras a la vez no pueden gastar el mismo stock
    productos = {p.id: p for p in Producto.objects.select_for_update().filter(id__in=pedidas)}

    faltantes = []
    for producto_id, cantidad in pedidas.items():
        producto = productos.get(producto_id)
        if producto is None:
            raise ErrorDePedido({'detalle': 'Uno de los productos del carrito ya no existe.'}, 400)
        if producto.stock < cantidad:
            faltantes.append({'producto': producto.id, 'nombre': producto.nombre, 'disponible': producto.stock})
    if faltantes:
        nombres = ', '.join(f['nombre'] for f in faltantes)
        raise ErrorDePedido(
            {'detalle': f'No hay stock suficiente de: {nombres}. Ajusta tu carrito.', 'faltantes': faltantes}, 409
        )

    estado, referencia = simular_pago(datos['metodo'], datos.get('tarjeta_final', ''))

    total = sum((productos[i].precio_final * c for i, c in pedidas.items()), Decimal('0'))
    pedido = Pedido.objects.create(
        usuario=usuario, estado=estado, metodo_pago=datos['metodo'], referencia_pago=referencia,
        nombre_cliente=datos['nombre'].strip(), direccion=datos['direccion'].strip(), total=total,
    )
    for producto_id, cantidad in pedidas.items():
        producto = productos[producto_id]
        ItemPedido.objects.create(
            pedido=pedido, producto=producto, nombre=producto.nombre,
            precio_unitario=producto.precio_final, cantidad=cantidad,
        )
        producto.stock -= cantidad
        producto.ventas += cantidad
        producto.save(update_fields=['stock', 'ventas'])
    return pedido


class PedidoViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Cada persona solo ve sus propios pedidos."""

    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pedido.objects.filter(usuario=self.request.user).prefetch_related('items')

    def create(self, request):
        entrada = PedidoEntrada(data=request.data)
        entrada.is_valid(raise_exception=True)
        try:
            pedido = crear_pedido(request.user, entrada.validated_data)
        except ErrorDePedido as e:
            return Response(e.cuerpo, status=e.codigo)
        return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)
