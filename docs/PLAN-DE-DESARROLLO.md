# Plan de desarrollo y control de versiones de FitMentor

Este documento resume cómo se organiza el trabajo en los cinco repositorios y qué falta por hacer.

## Repositorios

| Repositorio | Contenido | Tecnología |
|---|---|---|
| FITMENTOR-FRONT | Interfaz web, marca y acceso | React, Vite, TypeScript, GSAP |
| FITMENTOR-BACKEND | API REST, tiempo real, autenticación | Java 21, Spring Boot, STOMP |
| FITMENTOR-IA | Análisis de postura y coach | Python, FastAPI |
| FITMENTOR-BD | Esquema de PostgreSQL | SQL |
| ProyectoFitMentor-Patrones | Repo general: submódulos y documentación | - |

## Flujo de ramas

1. Nunca se trabaja en `main`. Cada cambio nace en una rama `<tipo>-<descripcion>` (`feat-`, `fix-`, `docs-`).
2. Un commit por cambio lógico, en formato Conventional Commits en inglés (`feat(auth): ...`).
3. Antes de cada commit corre lo que tenga el repo: tests, typecheck y build.
4. Cada rama se sube y se abre un Pull Request en español: qué cambia, por qué y cómo se probó.
5. Si una rama depende de otra que aún no está en `main`, su PR apunta a esa rama (PR apilados).
6. El merge lo hace la persona responsable del proyecto, nunca se hace automáticamente.

## Estado de los Pull Requests

Orden de fusión recomendado (de abajo hacia arriba en cada pila):

| Pila | PR base (a `main`) | PR apilado |
|---|---|---|
| Base de datos | `feat-schema-v2` (#1) | `feat-email-auth` (#2) |
| Backend | `feat-backend-v2` (#1) | `feat-email-auth` (#2) |
| IA | `feat-ai-v2` (#1) | `feat-ai-coach-v3` |
| Frontend | `feat-frontend-redesign` (#1) | `feat-brand-redesign-v3` (#2) |

Al fusionar un PR base, el PR apilado debe cambiar su destino a `main`.

## Fases

| Fase | Entregable | Estado |
|---|---|---|
| 1 | Backend Java con patrones de diseño, BD y servicio de IA | Hecho (PR #1 de cada repo) |
| 2 | Despliegue en la nube (Render, Netlify) | Hecho, desde las ramas |
| 3 | Rediseño de interfaz y marca | En revisión (FRONT #2) |
| 4 | Acceso con correo y contraseña, revocación de sesiones | En revisión (BACKEND #2, BD #2, FRONT #2) |
| 5 | Mejora del coach y del conteo de repeticiones | En revisión (IA) |
| 6 | Login con Google real | Pendiente: crear el Client ID en Google Cloud |
| 7 | Prueba E2E en navegador (STOMP y cámara) | Pendiente |
| 8 | Presentación del caso de estudio | Pendiente |
| 9 | Cierre: fusionar PRs, devolver los servicios a `main`, migrar la BD | Pendiente |

## Riesgos y fechas

- La base de datos gratuita de Render expira el **2026-11-08**: migrar o pagar antes.
- Los servicios de Render y Netlify se despliegan desde ramas; tras el merge deben volver a `main`.
- Falta verificar con una clave real de Anthropic el coach en modo Claude.
- Sin verificación de correo ni recuperación de contraseña (mejoras futuras).
- Rate limit por cuenta pendiente (hoy solo por IP).

## Seguridad

- Ningún secreto en el repositorio (`.env`, tokens, llaves).
- Los commits van a nombre del autor, sin coautoría de herramientas.
- Cada cambio de backend e IA pasó por una revisión independiente antes del PR.
