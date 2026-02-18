import pandas as pd
import streamlit as st

st.set_page_config(page_title="Finanzas Personales Pro", page_icon="💰", layout="wide")

st.title("💰 Finanzas Personales Pro")
st.caption("Controla ingresos, gastos y tu meta de ahorro mensual desde Streamlit.")

if "movements" not in st.session_state:
    st.session_state.movements = []

if "goal" not in st.session_state:
    st.session_state.goal = 0.0


def format_currency(value: float) -> str:
    return f"${value:,.2f} MXN"


with st.container(border=True):
    st.subheader("Registrar movimiento")
    with st.form("movement_form", clear_on_submit=True):
        col1, col2, col3 = st.columns(3)

        with col1:
            concept = st.text_input("Concepto", placeholder="Ej: Sueldo, supermercado")
        with col2:
            movement_type = st.selectbox("Tipo", ["Ingreso", "Gasto"])
        with col3:
            amount = st.number_input("Monto", min_value=0.01, step=10.0, format="%.2f")

        submitted = st.form_submit_button("Agregar")
        if submitted:
            if not concept.strip():
                st.warning("El concepto no puede estar vacío.")
            else:
                st.session_state.movements.insert(
                    0,
                    {
                        "Concepto": concept.strip(),
                        "Tipo": "income" if movement_type == "Ingreso" else "expense",
                        "Monto": float(amount),
                    },
                )
                st.success("Movimiento agregado correctamente.")

if st.session_state.movements:
    df = pd.DataFrame(st.session_state.movements)
else:
    df = pd.DataFrame(columns=["Concepto", "Tipo", "Monto"])

income_total = df.loc[df["Tipo"] == "income", "Monto"].sum() if not df.empty else 0.0
expense_total = df.loc[df["Tipo"] == "expense", "Monto"].sum() if not df.empty else 0.0
balance = income_total - expense_total
savings_rate = (balance / income_total * 100) if income_total > 0 else 0.0

st.subheader("Resumen mensual")
col1, col2, col3, col4 = st.columns(4)
col1.metric("Ingresos", format_currency(income_total))
col2.metric("Gastos", format_currency(expense_total))
col3.metric("Balance", format_currency(balance))
col4.metric("Ahorro estimado", f"{savings_rate:.1f}%")

with st.container(border=True):
    st.subheader("Meta de ahorro")
    goal_value = st.number_input(
        "Objetivo mensual (MXN)",
        min_value=0.0,
        value=float(st.session_state.goal),
        step=100.0,
        format="%.2f",
    )

    if st.button("Guardar meta"):
        st.session_state.goal = float(goal_value)
        st.success("Meta guardada.")

    goal = st.session_state.goal
    if goal <= 0:
        st.info("Define una meta para ver tu progreso.")
    else:
        progress = max(0.0, min(1.0, balance / goal))
        st.progress(progress, text=f"Progreso: {progress * 100:.1f}%")
        if balance >= goal:
            st.success(f"¡Meta cumplida! Superaste {format_currency(goal)}.")
        else:
            missing = goal - max(balance, 0.0)
            st.warning(f"Te faltan {format_currency(missing)} para cumplir tu meta.")

with st.container(border=True):
    st.subheader("Historial")
    if df.empty:
        st.write("Aún no hay movimientos registrados.")
    else:
        view_df = df.copy()
        view_df["Tipo"] = view_df["Tipo"].map({"income": "Ingreso", "expense": "Gasto"})
        view_df["Monto"] = view_df["Monto"].map(format_currency)
        st.dataframe(view_df, hide_index=True, use_container_width=True)

        csv_df = pd.DataFrame(st.session_state.movements)
        st.download_button(
            "Descargar historial (CSV)",
            csv_df.to_csv(index=False).encode("utf-8"),
            file_name="historial_finanzas.csv",
            mime="text/csv",
        )

    if st.button("Limpiar todo", type="secondary"):
        st.session_state.movements = []
        st.success("Datos eliminados.")
        st.rerun()
