/** Validadores de negocio para el sistema Turix. */
function validateTrip(data) {
  const errors = [];
  if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) errors.push('El codigo del viaje es obligatorio');
  else if (data.code.trim().length > 20) errors.push('El codigo no puede exceder 20 caracteres');
  if (!data.name || data.name.trim().length === 0) errors.push('El nombre del destino es obligatorio');
  if (!data.description || data.description.trim().length === 0) errors.push('La descripcion es obligatoria');
  if (!data.destination || data.destination.trim().length === 0) errors.push('El destino es obligatorio');
  if (data.available_slots === undefined || data.available_slots === null || data.available_slots < 0) errors.push('Los cupos disponibles deben ser un numero mayor o igual a cero');
  if (!data.category_id || data.category_id < 1) errors.push('La categoria es obligatoria');
  const isBookable = data.is_bookable === true || data.is_bookable === 'true' || data.is_bookable === 1 || data.is_bookable === '1';
  if (data.price === undefined || data.price === null || data.price === '' || Number(data.price) < 0) errors.push('El precio debe ser cero o un valor positivo');
  if (isBookable && Number(data.price) <= 0) errors.push('Un viaje reservable debe tener un precio mayor a cero');
  if (data.duration_days !== undefined && data.duration_days < 1) errors.push('La duracion debe ser de al menos un dia');

  const hasLatitude = data.latitude !== undefined && data.latitude !== null && data.latitude !== '';
  const hasLongitude = data.longitude !== undefined && data.longitude !== null && data.longitude !== '';
  if (hasLatitude !== hasLongitude) {
    errors.push('Latitud y longitud deben registrarse juntas');
  } else if (hasLatitude) {
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.push('La latitud debe estar entre -90 y 90');
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.push('La longitud debe estar entre -180 y 180');
  }
  return errors;
}

function validateRegister(data) {
  const errors = [];
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email valido requerido');
  if (!data.password || data.password.length < 6) errors.push('La contrasena debe tener al menos 6 caracteres');
  if (!data.full_name || data.full_name.trim().length < 2) errors.push('El nombre completo es obligatorio');
  return errors;
}

function validateCheckout(items) {
  const errors = [];
  if (!Array.isArray(items) || items.length === 0) return ['El carrito no puede estar vacio'];
  items.forEach((item, index) => {
    if (!item.trip_id || item.trip_id < 1) errors.push(`Item ${index + 1}: trip_id invalido`);
    if (!item.quantity || item.quantity < 1) errors.push(`Item ${index + 1}: cantidad debe ser mayor o igual a uno`);
  });
  return errors;
}

module.exports = { validateTrip, validateRegister, validateCheckout };
