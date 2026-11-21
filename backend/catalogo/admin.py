from django.contrib import admin, messages

from .models import STOCK_BAJO, Categoria, ItemPedido, Pedido, Producto


class EstadoStockFilter(admin.SimpleListFilter):
    """Filtro lateral para ver rápido qué hay que reponer."""

    title = 'estado del stock'
    parameter_name = 'estado_stock'

    def lookups(self, request, model_admin):
        return [
            ('agotado', 'Agotado'),
            ('bajo', f'Stock bajo (hasta {STOCK_BAJO})'),
            ('disponible', 'Disponible'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'agotado':
            return queryset.filter(stock=0)
        if self.value() == 'bajo':
            return queryset.filter(stock__gt=0, stock__lte=STOCK_BAJO)
        if self.value() == 'disponible':
            return queryset.filter(stock__gt=STOCK_BAJO)
        return queryset


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'descripcion')
    search_fields = ('nombre',)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    """Gestión de inventario: solo los administradores pueden cambiar el stock."""

    list_display = (
        'id', 'nombre', 'tipo', 'categoria', 'precio', 'descuento', 'stock', 'estado_stock', 'ventas',
    )
    list_filter = ('tipo', 'categoria', EstadoStockFilter, 'descuento')
    search_fields = ('nombre',)
    list_editable = ('precio', 'descuento', 'stock')
    ordering = ('stock', 'nombre')  # primero lo que se está acabando
    fieldsets = (
        (None, {'fields': ('nombre', 'descripcion', 'categoria', 'tipo', 'precio', 'descuento', 'stock', 'ventas', 'imagen')}),
        ('Datos del juego', {'fields': ('jugadores', 'duracion', 'edad', 'dificultad')}),
        ('Información ampliada', {
            'fields': ('componentes', 'preparacion', 'como_jugar', 'como_ganar', 'consejos', 'video'),
            'description': 'Se muestra al pulsar "Ver juego". En los textos, escribe una línea por paso.',
        }),
    )
    actions = ['reponer_10', 'reponer_50', 'quitar_descuento']

    @admin.display(description='estado')
    def estado_stock(self, producto):
        if producto.stock == 0:
            return 'Agotado'
        if producto.stock_bajo:
            return 'Stock bajo'
        return 'Disponible'

    @admin.action(description='Reponer +10 unidades a los seleccionados')
    def reponer_10(self, request, queryset):
        for producto in queryset:
            producto.stock += 10
            producto.save(update_fields=['stock'])
        self.message_user(request, f'Se agregaron 10 unidades a {queryset.count()} juego(s).', messages.SUCCESS)

    @admin.action(description='Reponer +50 unidades a los seleccionados')
    def reponer_50(self, request, queryset):
        for producto in queryset:
            producto.stock += 50
            producto.save(update_fields=['stock'])
        self.message_user(request, f'Se agregaron 50 unidades a {queryset.count()} juego(s).', messages.SUCCESS)

    @admin.action(description='Quitar el descuento a los seleccionados')
    def quitar_descuento(self, request, queryset):
        cantidad = queryset.update(descuento=0)
        self.message_user(request, f'Se quitó el descuento a {cantidad} juego(s).', messages.SUCCESS)


class ItemPedidoInline(admin.TabularInline):
    model = ItemPedido
    extra = 0
    can_delete = False
    fields = ('nombre', 'precio_unitario', 'cantidad')
    readonly_fields = ('nombre', 'precio_unitario', 'cantidad')

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    """Pedidos de los clientes: el administrador cambia el estado o cancela (devuelve el stock)."""

    list_display = ('id', 'usuario', 'nombre_cliente', 'creado', 'estado', 'metodo_pago', 'total')
    list_filter = ('estado', 'metodo_pago')
    search_fields = ('nombre_cliente', 'usuario__username')
    readonly_fields = ('usuario', 'creado', 'metodo_pago', 'referencia_pago', 'total')
    inlines = [ItemPedidoInline]
    actions = ['marcar_pagado', 'marcar_enviado', 'marcar_entregado', 'cancelar_y_devolver_stock']

    def has_add_permission(self, request):
        return False  # los pedidos solo nacen desde la tienda

    @admin.action(description='Marcar como pagado')
    def marcar_pagado(self, request, queryset):
        cantidad = queryset.exclude(estado='cancelado').update(estado='pagado')
        self.message_user(request, f'{cantidad} pedido(s) marcados como pagados.', messages.SUCCESS)

    @admin.action(description='Marcar como enviado')
    def marcar_enviado(self, request, queryset):
        cantidad = queryset.exclude(estado='cancelado').update(estado='enviado')
        self.message_user(request, f'{cantidad} pedido(s) marcados como enviados.', messages.SUCCESS)

    @admin.action(description='Marcar como entregado')
    def marcar_entregado(self, request, queryset):
        cantidad = queryset.exclude(estado='cancelado').update(estado='entregado')
        self.message_user(request, f'{cantidad} pedido(s) marcados como entregados.', messages.SUCCESS)

    @admin.action(description='Cancelar y devolver el stock al inventario')
    def cancelar_y_devolver_stock(self, request, queryset):
        cancelados = sum(1 for pedido in queryset if pedido.cancelar())
        self.message_user(request, f'{cancelados} pedido(s) cancelados y stock devuelto.', messages.SUCCESS)
