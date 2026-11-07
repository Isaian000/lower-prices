// Validador mínimo de JSON Schema (el subconjunto que usa openapi.ts), solo para pruebas.
import { openApiDocument } from "../openapi.js";

interface Schema {
  $ref?: string;
  type?: string | readonly string[];
  enum?: readonly unknown[];
  required?: readonly string[];
  properties?: Record<string, Schema>;
  items?: Schema;
}

const schemas = openApiDocument.components.schemas as unknown as Record<string, Schema>;

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  const actual = typeOf(value);
  return actual === type || (type === "number" && actual === "integer");
}

/** Devuelve la lista de errores; vacía si el valor cumple el esquema. */
export function validate(value: unknown, schema: Schema | string, path = "$"): string[] {
  if (typeof schema === "string") schema = { $ref: `#/components/schemas/${schema}` };
  if (schema.$ref) {
    const name = schema.$ref.split("/").pop()!;
    const target = schemas[name];
    return target ? validate(value, target, path) : [`${path}: esquema ${name} no existe`];
  }

  const errors: string[] = [];
  if (schema.type) {
    const types = typeof schema.type === "string" ? [schema.type] : schema.type;
    if (!types.some((type) => matchesType(value, type))) {
      return [`${path}: se esperaba ${types.join("|")} y llegó ${typeOf(value)}`];
    }
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: ${JSON.stringify(value)} no está en ${JSON.stringify(schema.enum)}`);
  }
  if (typeOf(value) === "object") {
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in object)) errors.push(`${path}.${key}: falta`);
    }
    for (const [key, child] of Object.entries(object)) {
      const childSchema = schema.properties?.[key];
      if (!childSchema) errors.push(`${path}.${key}: no está documentado`);
      else errors.push(...validate(child, childSchema, `${path}.${key}`));
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) =>
      errors.push(...validate(item, schema.items!, `${path}[${index}]`)),
    );
  }
  return errors;
}
