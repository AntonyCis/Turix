#!/bin/bash

echo "🔄 Ejecutando 100 requests para verificar distribución de pesos..."
echo ""

declare -A counter

for i in $(seq 1 100); do
    NODE=$(curl -s http://localhost:8080/api/health | grep -o '"node_id":"[^"]*"' | cut -d'"' -f4)
    counter[$NODE]=$((${counter[$NODE]:-0} + 1))
done

echo "📊 Distribución de Carga (esperado: ~50/30/20):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for node in "${!counter[@]}"; do
    echo "   $node: ${counter[$node]} requests (${counter[$node]}%)"
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"