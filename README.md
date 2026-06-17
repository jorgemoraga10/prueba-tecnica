# Como correr el proyecto

Este archivo deja el paso a paso mas simple para levantar la base de datos, el backend y el frontend.

## Requisitos

- Docker Desktop
- Python 3.11
- Node.js 20+
- PDM instalado
- npm instalado

## 1. Levantar la base de datos

Desde la raiz del proyecto:

```bash
docker compose up -d
```

Esto levanta PostgreSQL usando el `docker-compose.yml`.

## 2. Levantar el backend

Abre una terminal en la carpeta `backend`:

```bash
cd backend
```

Crea el archivo `.env` si aun no existe:

```bash
cp .env.example .env
```

Instala dependencias:

```bash
pdm install
```

Aplica migraciones:

```bash
pdm run python manage.py migrate
```

Levanta el servidor:

```bash
pdm run python manage.py runserver
```

Backend disponible en:

```txt
http://localhost:8000
```

Swagger disponible en:

```txt
http://localhost:8000/api/docs/
```

## 3. Levantar el frontend

Abre otra terminal en la carpeta `frontend`:

```bash
cd frontend
```

Crea el archivo `.env.local` si aun no existe:

```bash
cp .env.example .env.local
```

Verifica que `NEXT_PUBLIC_API_URL` apunte al backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Instala dependencias:

```bash
npm install
```

Levanta el frontend:

```bash
npm run dev
```

Frontend disponible en:

```txt
http://localhost:3000
```

Modulo principal:

```txt
http://localhost:3000/tasks
```

## 4. Orden recomendado para correr todo

1. `docker compose up -d`
2. levantar backend en `backend`
3. levantar frontend en `frontend`

## 5. Si algo falla

- Revisa que Docker este corriendo.
- Revisa que el puerto `5432` no este ocupado.
- Revisa que el backend este corriendo en `http://localhost:8000`.
- Revisa que `NEXT_PUBLIC_API_URL` en el frontend apunte al backend.
- Si cambias modelos en Django, vuelve a correr migraciones.

## 6. Funcionalidades implementadas

- Crear, listar, editar y eliminar cobros.
- Crear, listar, editar y eliminar movimientos bancarios.
- Conciliar un movimiento contra uno o varios cobros pendientes.
- Ver saldo pendiente y saldo disponible en tiempo real.
- Ver historico de cobros con detalle de pagos asociados.
- Swagger disponible para probar la API.

## 7. Adiciones a la base de datos

- Se agrego la tabla `PaymentAllocation` para resolver la relacion entre cobros y movimientos.
- Se agregaron campos de auditoria `created_at` y `updated_at` en las tablas principales.
- Se agregaron restricciones para evitar montos `0` o negativos.
- Se agrego una restriccion unica para no duplicar un mismo cobro por `contrato + mes + moneda`.
- Se calcularon saldos usando relaciones y agregaciones entre tablas, sin guardar esos totales de forma fija.

## 8. Supuestos que tome para el desarrollo

- La UF se fijo en `40.000 CLP` durante toda la prueba.
- Los movimientos bancarios siempre se registran en `CLP`.
- Un cobro puede recibir pagos parciales desde varios movimientos.
- Un movimiento puede distribuirse entre varios cobros.
- Si un cobro ya tiene pagos asociados, no se puede editar ni eliminar.
- Si un movimiento ya tiene asignaciones asociadas, no se puede editar ni eliminar.
- La conciliacion parte desde un movimiento con saldo disponible.

## 9. Reglas de negocio que implemente

- No se permite asignar un monto mayor al saldo pendiente del cobro.
- No se permite asignar un monto mayor al saldo disponible del movimiento.
- La conciliacion puede incluir uno o varios cobros en una sola operacion.
- El historico distingue cobros `pendientes`, `parciales` y `pagados`.
- El frontend valida casos basicos, pero la validacion final queda en el backend.


## 10. Preguntas que me quedaron

- ¿La UF debe seguir fija o debe variar por fecha?
- ¿Quien puede crear, editar y conciliar?
- ¿Como se corrige una conciliacion mal hecha?
- ¿Los datos se cargan manualmente o desde otro sistema?
- ¿Que filtros son obligatorios para operar?
- ¿Que roles pueden ver, editar o eliminar?
