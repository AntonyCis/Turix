# Turix — Guía de Despliegue Docker

## Comandos en Orden

### 1. Construir y levantar todos los servicios

```bash
docker compose up --build -d
```

### 2. Esperar a que MySQL Master esté healthy (~20 segundos)

```bash
# Verificar que MySQL responde
docker exec turix-db-master mysqladmin ping -uroot -psupersecreto --silent
```

### 3. Crear usuario de replicación en Master

```bash
docker exec turix-db-master mysql -uroot -psupersecreto -e "
  CREATE USER IF NOT EXISTS 'replicator'@'%' IDENTIFIED WITH mysql_native_password BY 'repl_password';
  GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
  FLUSH PRIVILEGES;
"
```

### 4. Obtener posición del binlog

```bash
docker exec turix-db-master mysql -uroot -psupersecreto -e "SHOW MASTER STATUS\G"
```

> Anotar los valores de `File` y `Position`.

### 5. Configurar Slave con los valores obtenidos

```bash
docker exec turix-db-slave mysql -uroot -psupersecreto -e "
  STOP SLAVE;
  CHANGE MASTER TO
    MASTER_HOST='db_master',
    MASTER_USER='replicator',
    MASTER_PASSWORD='repl_password',
    MASTER_LOG_FILE='<VALOR_FILE>',
    MASTER_LOG_POS=<VALOR_POS>;
  START SLAVE;
"
```

### 6. Verificar replicación

```bash
docker exec turix-db-slave mysql -uroot -psupersecreto -e "SHOW SLAVE STATUS\G" | grep -E "(Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master)"
```

Esperado: `Slave_IO_Running: Yes`, `Slave_SQL_Running: Yes`, `Seconds_Behind_Master: 0`.

### 7. Verificar estado de todos los contenedores

```bash
docker compose ps
```

### 8. Verificar health check de la app

```bash
Invoke-WebRequest -Uri http://localhost:8080/api/health -UseBasicParsing
```

---

## URLs de Servicios

| Servicio | URL |
|---|---|
| App Web | `http://localhost:8080` |
| phpMyAdmin | `http://localhost:8081` |
| API Health | `http://localhost:8080/api/health` |

## Credenciales

| Servicio | Usuario | Contraseña |
|---|---|---|
| App Admin | `admin@turix.ec` | `admin123` |
| MySQL Root | `root` | `supersecreto` |
| MySQL App | `turix_user` | `turix_secret` |

## Comandos Útiles

```bash
# Ver logs de un nodo
docker logs turix-app-1

# Reiniciar un servicio
docker compose restart app-node-2

# Detener todo
docker compose down

# Detener y eliminar volúmenes
docker compose down -v

# Reconstruir desde cero
docker compose down -v
docker volume rm turix-mysql-master turix-mysql-slave
docker compose up --build -d
```

## Arquitectura

```
NGINX (:8080)
  ├── app-node-1 (weight=5) ──┐
  ├── app-node-2 (weight=3) ──┼── MySQL Master (escrituras)
  └── app-node-3 (weight=2) ──┘
                                 MySQL Slave (lecturas, replicación)
phpMyAdmin (:8081) ────────── Master + Slave
```
