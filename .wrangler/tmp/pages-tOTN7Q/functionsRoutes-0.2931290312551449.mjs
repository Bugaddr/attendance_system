import { onRequest as __api_auth_login_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/auth/login.js"
import { onRequest as __api_auth_logout_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/auth/logout.js"
import { onRequest as __api_auth_me_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/auth/me.js"
import { onRequest as __api_auth_register_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/auth/register.js"
import { onRequest as __api_attendance_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/attendance.js"
import { onRequest as __api_session_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/session.js"
import { onRequest as __api_sessions_js_onRequest } from "/home/bugaddr/Documents/playground/attendance_system/functions/api/sessions.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_login_js_onRequest],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequest],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_me_js_onRequest],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_register_js_onRequest],
    },
  {
      routePath: "/api/attendance",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_attendance_js_onRequest],
    },
  {
      routePath: "/api/session",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_session_js_onRequest],
    },
  {
      routePath: "/api/sessions",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_sessions_js_onRequest],
    },
  ]