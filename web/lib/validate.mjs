export function validate(input) {
  const errors = [];
  const r = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {errors:['Expected a JSON object'],request:{}};
  const limits = {request_id:[3,64],requester_email:[3,254],category:[2,24],description:[10,2000],business_impact:[2,24],urgency:[2,16]};
  for (const [k,[min,max]] of Object.entries(limits)) {
    if (typeof input[k] !== 'string') {errors.push(`${k}: required string`); continue;}
    r[k] = input[k].trim().replace(/\s+/g,' ');
    if (k === 'request_id') r[k] = r[k].toUpperCase();
    else if (k !== 'description') r[k] = r[k].toLowerCase();
    if (r[k].length < min || r[k].length > max) errors.push(`${k}: ${min}–${max} characters required`);
  }
  if (r.request_id && !/^[A-Z0-9][A-Z0-9_-]*$/.test(r.request_id)) errors.push('request_id: letters, digits, hyphens and underscores only');
  if (r.requester_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.requester_email)) errors.push('requester_email: invalid email');
  for (const [k,values] of Object.entries({category:['access','hardware','software','network','other'],business_impact:['single_user','team','organization'],urgency:['normal','high']})) {
    if (r[k] && !values.includes(r[k])) errors.push(`${k}: use ${values.join(', ')}`);
  }
  return {errors,request:r};
}
