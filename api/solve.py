from http.server import BaseHTTPRequestHandler
import json
from sympy import symbols, diff, integrate, simplify, parse_expr

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode('utf-8'))
        
        m_str = data.get('m', '')
        n_str = data.get('n', '')
        
        x, y = symbols('x y')
        
        try:
            # Convertir el texto de JavaScript a matemáticas de Python
            M = parse_expr(m_str, transformations='all')
            N = parse_expr(n_str, transformations='all')
            
            # Paso 1: Derivadas parciales (Criterio de Exactitud)
            dM_dy = diff(M, y)
            dN_dx = diff(N, x)
            
            is_exact = simplify(dM_dy - dN_dx) == 0
            is_approximate = False
            
            if is_exact:
                # Paso 2: Integrar M respecto a x
                f_xy_partial = integrate(M, x)
                
                # Paso 3: Derivar eso respecto a y, y compararlo con N
                df_dy = diff(f_xy_partial, y)
                g_prime = simplify(N - df_dy)
                
                # Paso 4: Integrar la parte restante para obtener g(y)
                gy = integrate(g_prime, y)
                
                # Solución final
                solucion_final = f_xy_partial + gy
                
                # Detectar si la integral dejó términos complejos no resueltos (Aproximación)
                if 'Integral' in str(gy):
                    is_approximate = True
                
                response_data = {
                    "status": "success",
                    "tipo": "Exacta",
                    "dM_dy": str(dM_dy),
                    "dN_dx": str(dN_dx),
                    "f_partial": str(f_xy_partial),
                    "g_prime": str(g_prime),
                    "g_y": str(gy),
                    "solucion": f"{solucion_final} = C",
                    "is_approximate": is_approximate
                }
            else:
                # Fallback: Si no es exacta (por ahora, alerta al frontend)
                response_data = {
                    "status": "not_exact",
                    "dM_dy": str(dM_dy),
                    "dN_dx": str(dN_dx),
                    "mensaje": "La ecuación no es exacta. El módulo homogéneo está en desarrollo."
                }
                
        except Exception as e:
            response_data = {
                "status": "error",
                "mensaje": f"Error al procesar la ecuación: {str(e)}"
            }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))
