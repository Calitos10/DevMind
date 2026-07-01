Levantar:
docker compose up -d

Apagar (sin borrar datos):
docker compose down

Apagar borrando todo (volumen incluido, datos perdidos):
docker compose down -v

Borrar el contenido de las tablas:

 - Primero hay que entrar en el pgsql del contenedor para luego ejecutar el comando de borrado:

 docker exec -it devmind-postgres psql -U devmind -d devmind_db -c "TRUNCATE TABLE project_files, projects, users RESTART IDENTITY CASCADE;"

