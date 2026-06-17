from flask import Flask, request, jsonify
from sympy import symbols, diff, integrate, simplify
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

app = Flask(__name__)

@app.route('/api/solve', methods=['POST'])
def solve():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "mensaje": "No se recibieron datos"}), 400

        m_str = data.get('m', '').replace('^', '**')
        n_str = data.get('n', '').replace('^', '**')

        x, y = symbols('x y')
        
        # Permite que SymPy entienda "2xy" como "2*x*y"
        transformations = (standard_transformations + (implicit_multiplication_application,))

        M = parse_expr(m_str, transformations=transformations)
        N = parse_expr(n_str, transformations=transformations)

        # Paso 1: Derivadas parciales
        dM_dy = diff(M, y)
        dN_dx = diff(N, x)

        is_exact = simplify(dM_dy - dN_dx) == 0

        if is_exact:
            # Procedimiento Exacta
            f_partial = integrate(M, x)
            df_dy = diff(f_partial, y)
            g_prime = simplify(N - df_dy)
            gy = integrate(g_prime, y)
            solucion = f_partial + gy

            return jsonify({
                "status": "success",
                "dM_dy": str(dM_dy),
                "dN_dx": str(dN_dx),
                "f_partial": str(f_partial),
                "g_prime": str(g_prime),
                "g_y": str(gy),
                "solucion": f"{solucion} = C",
                "is_approximate": 'Integral' in str(gy)
            })
        else:
            return jsonify({
                "status": "not_exact",
                "dM_dy": str(dM_dy),
                "dN_dx": str(dN_dx),
                "mensaje": "La ecuación no es exacta."
            })

    except Exception as e:
        # Esto evita que Vercel colapse y te manda el error exacto a la pantalla
        return jsonify({
            "status": "error",
            "mensaje": f"Error de sintaxis matemática: {str(e)}"
        }), 400
