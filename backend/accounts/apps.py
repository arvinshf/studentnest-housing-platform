from django.apps import AppConfig
# AppConfig is the base class for configuring a Django app


class AccountsConfig(AppConfig):
    # this class tells Django about the "accounts" app

    default_auto_field = 'django.db.models.BigAutoField'
    # sets the default primary key type for all models in this app to BigAutoField
    # BigAutoField is an auto-incrementing 64-bit integer (1, 2, 3, ...)
    name = 'accounts'
