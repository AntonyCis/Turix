/**
 * Validadores de negocio para el sistema Turix.
 */

/**
 * Valida campos obligatorios de un viaje.
 */
function validateTrip(data) {
  const errors = [];

  if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
    errors.push('El código del viaje es obligatorio');
  } else if (data.code.trim().length > 20) {
    errors.push('El código no puede exceder 20 caracteres');
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.push('El nombre del destino es obligatorio');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('La descripción es obligatoria');
  }

  if (!data.destination || data.destination.trim().length === 0) {
    errors.push('El destino es obligatorio');
  }

  if (data.available_slots === undefined || data.available_slots === null || data.available_slots < 0) {
    errors.push('Los cupos disponibles deben ser un número >= 0');
  }

  if (!data.category_id || data.category_id < 1) {
    errors.push('La categoría es obligatoria');
  }

  if (!data.price || data.price <= 0) {
    errors.push('El precio debe ser mayor a 0');
  }

  if (data.duration_days !== undefined && data.duration_days < 1) {
    errors.push('La duración debe ser al menos 1 día');
  }

  return errors;
}

/**
 * Valida datos de registro de usuario.
 */
function validateRegister(data) {
  const errors = [];

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email válido requerido');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push('El nombre completo es obligatorio');
  }

  return errors;
}

/**
 * Valida items del carrito para checkout.
 */
function validateCheckout(items) {
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('El carrito no puede estar vacío');
    return errors;
  }

  items.forEach((item, i) => {
    if (!item.trip_id || item.trip_id < 1) {
      errors.push(`Item ${i + 1}: trip_id inválido`);
    }
    if (!item.quantity || item.quantity < 1) {
      errors.push(`Item ${i + 1}: cantidad debe ser >= 1`);
    }
  });

  return errors;
}

module.exports = { validateTrip, validateRegister, validateCheckout };
