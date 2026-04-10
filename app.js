const SUPABASE_URL = window.__SUPABASE_URL__ || '';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Variables de entorno no configuradas');
}

const supabaseClient = SUPABASE_URL ? window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const form = document.getElementById('reservaForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

const inputFecha = document.getElementById('fecha');
const hoy = new Date().toISOString().split('T')[0];
inputFecha.min = hoy;

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!supabaseClient) {
        mostrarError('Configuración incompleta. Contacta al administrador.');
        return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const personas = parseInt(document.getElementById('personas').value);
    const notas = document.getElementById('notas').value.trim();

    if (!nombre || !email || !telefono || !fecha || !hora || !personas) {
        mostrarError('Por favor completa todos los campos.');
        return;
    }

    if (!validarEmail(email)) {
        mostrarError('Email inválido.');
        return;
    }

    const submitBtn = form.querySelector('.submit-button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';

    try {
        const { data, error } = await supabaseClient
            .from('dioxyz.reservas')
            .insert([{
                restaurante_id: '550e8400-e29b-41d4-a716-446655440000',
                fecha, hora, personas,
                nombre_cliente: nombre,
                email_cliente: email,
                telefono_cliente: telefono,
                notas: notas || null,
                estado: 'pendiente'
            }])
            .select();

        if (error) throw error;

        form.style.display = 'none';
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';

        setTimeout(() => {
            form.reset();
            form.style.display = 'block';
            successMessage.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmar Reserva';
        }, 3000);

    } catch (err) {
        mostrarError('Error: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar Reserva';
    }
});

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mostrarError(mensaje) {
    errorText.textContent = mensaje;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
}

function cargarSupabaseSDK() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => console.log('✅ Supabase SDK cargado');
    script.onerror = () => mostrarError('Error cargando Supabase');
    document.head.appendChild(script);
}

window.addEventListener('load', cargarSupabaseSDK);
console.log('🌊 Don Or - Sistema de Reservas');
