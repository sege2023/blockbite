from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
#from core.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('silk/', include('silk.urls', namespace='silk')),
#    path('api/user/register/', CreateUserView.as_view(), name="register"),
    path('api/token/', TokenObtainPairView.as_view(), name="token_obtain"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name="token_refresh"),    
    path('api/schema/', SpectacularAPIView.as_view(), name="schema"),    
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name="swagger-ui"),    
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name="redoc"),    
#    path('api/auth/', include('rest_framework.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
