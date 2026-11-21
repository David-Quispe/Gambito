from django.contrib import admin, messages

from .models import STOCK_BAJO, Categoria, Producto


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
        'id', 'nombre', 'categoria', 'precio', 'descuento', 'stock', 'estado_stock', 'ventas',
    )
    list_filter = ('categoria', EstadoStockFilter, 'descuento')
    search_fields = ('nombre',)
    list_editable = ('precio', 'descuento', 'stock')
    ordering = ('stock', 'nombre')  # primero lo que se está acabando
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
