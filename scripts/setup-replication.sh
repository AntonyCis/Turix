#!/bin/bash
# ============================================
# TURIX - Setup MySQL Master-Slave Replication
# ============================================

echo "============================================"
echo "  TURIX - Configuración de Replicación"
echo "============================================"

# Esperar a que MySQL Master esté listo
echo ""
echo "⏳ Esperando que MySQL Master esté listo..."
until docker exec turix-db-master mysqladmin ping -uroot -psupersecreto --silent 2>/dev/null; do
    sleep 2
    printf "."
done
echo " ✅ Master listo"

# Esperar a que MySQL Slave esté listo
echo "⏳ Esperando que MySQL Slave esté listo..."
until docker exec turix-db-slave mysqladmin ping -uroot -psupersecreto --silent 2>/dev/null; do
    sleep 2
    printf "."
done
echo " ✅ Slave listo"

# Crear usuario de replicación en el Master
echo ""
echo "🔧 Creando usuario de replicación en Master..."
docker exec turix-db-master mysql -uroot -psupersecreto -e "
    CREATE USER IF NOT EXISTS 'replicator'@'%' IDENTIFIED WITH mysql_native_password BY 'repl_password';
    GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
    FLUSH PRIVILEGES;
    FLUSH TABLES WITH READ LOCK;
"

# Obtener posición del binlog
echo "📋 Obteniendo posición del binlog..."
MASTER_STATUS=$(docker exec turix-db-master mysql -uroot -psupersecreto -e "SHOW MASTER STATUS\G")
MASTER_LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
MASTER_LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "   → Log File: $MASTER_LOG_FILE"
echo "   → Log Position: $MASTER_LOG_POS"

# Desbloquear tablas
docker exec turix-db-master mysql -uroot -psupersecreto -e "UNLOCK TABLES;"

# Configurar el Slave
echo ""
echo "🔗 Configurando Slave para replicar desde Master..."
docker exec turix-db-slave mysql -uroot -psupersecreto -e "
    STOP SLAVE;
    CHANGE MASTER TO
        MASTER_HOST='db_master',
        MASTER_USER='replicator',
        MASTER_PASSWORD='repl_password',
        MASTER_LOG_FILE='${MASTER_LOG_FILE}',
        MASTER_LOG_POS=${MASTER_LOG_POS};
    START SLAVE;
"

# Verificar estado
echo ""
echo "✅ Verificando estado de replicación..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
docker exec turix-db-slave mysql -uroot -psupersecreto -e "SHOW SLAVE STATUS\G" | grep -E "(Slave_IO_Running|Slave_SQL_Running|Seconds_Behind_Master|Last_Error)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "🎉 Replicación Master → Slave configurada exitosamente"
echo "   Master: turix-db-master:3306"
echo "   Slave:  turix-db-slave:3306 (expuesto en host:3307)"
