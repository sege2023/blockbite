from django.contrib import admin
from .models import Order, OrderItem, User, Product

# Register your models here.

class OrderItemInline(admin.TabularInline):
    model = OrderItem


class OrderAdmin(admin.ModelAdmin):
    inlines = [
        OrderItemInline
    ]

# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):
#     list_display = ['name', 'price', 'stock', 'image_preview', 'in_stock', 'storage_type']
#     # list_filter = ['in_stock']
#     search_fields = ['name', 'description']
    
#     # Only show fields that users should edit
#     fields = ['name', 'description', 'price', 'stock', 'image', 'image_r2_url', 'image_r2_key']
    
#     # Make R2 fields read-only (auto-populated)
#     readonly_fields = ['image_r2_url', 'image_r2_key']
    
#     def image_preview(self, obj):
#         """Show image preview in admin"""
#         image_url = obj.get_image_url
#         if image_url:
#             return "image"
#         return "No image"
#     image_preview.short_description = "Preview"
    
#     def storage_type(self, obj):
#         """Show where image is stored"""
#         if obj.image_r2_url:
#             return "R2 Storage"
#         elif obj.image:
#             return "Local Storage"
#         return "No Image"
#     storage_type.short_description = "Storage"

admin.site.register(Order, OrderAdmin)
admin.site.register(User)
admin.site.register(Product)