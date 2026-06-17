from http.server import BaseHTTPRequestHandler
import json
from sympy import symbols, diff, integrate, simplify
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                raise ValueError("Cuerpo de la petición vacío")
                
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            m_str = data.get('m', '')
            n_str = data.get('n', '')
            
            # Reemplazar el símbolo ^ por ** (que es el que entiende Python para potencias)
            m_str = m_str.replace('^', '**')
            n_str = n_str.replace('^', '**')
            
            x, y = symbols('x y')
            
            # Configurar SymPy para que entienda "2x" como "2*x"
            transformations = (standard_transformations + (implicit_multiplication_application,))
            
            M = parse_expr(m_str, transformations=transformations)
            N = parse_expr(n_str, transformations=transformations)
            
            # Paso 1: Derivadas parciales
            dM_dy = diff(M, y)
            dN_dx = diff(N, x)
            
            is_exact = simplify(dM_dy - dN_dx) == 0
            is_approximate = False
            
            if is_exact:
                f_xy_partial = integrate(M, x)
                df_dy = diff(f_xy_partial, y)
                g_prime = simplify(N - df_dy)
                gy = integrate(g_prime, y)
                solucion_final = f_xy_partial + gy
                
                if 'Integral' in str(gy):
                    is_approximate = True
                
                response_data = {
                    "status": "success",
                    "dM_dy": str(dM_dy),
                    "dN_dx": str(dN_dx),
                    "f_partial": str(f_xy_partial),
                    "g_prime": str(g_prime),
                    "g_y": str(gy),
                    "solucion": f"{solucion_final} = C",
                    "is_approximate": is_approximate
                }
            else:
                response_data = {
                    "status": "not_exact",
                    "dM_dy": str(dM_dy),
                    "dN_dx": str(dN_dx),
                    "mensaje": "La ecuación no es exacta."
                }
                
            self.send_response(200)
            
        except Exception as e:
            # Si hay un error matemático o de sintaxis, lo atrapamos y enviamos al front
            self.send_response(400)
            response_data = {
                "status": "error",
                "mensaje": str(e)
            }

        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

