const SUPABASE_URL = window.__SUPABASE_URL__ || '';
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__ || '';

let supabaseClient = null;
let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
    cargarSupabaseSDK();
    inicializarFormulario();
    inicializarSelectores();
});

function cargarSupabaseSDK() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
        if (SUPABASE_URL && SUPABASE_ANON_KEY) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase cargado');
        }
    };
    document.head.appendChild(script);
}

function inicializarFormulario() {
    const form = document.getElementById('reservaForm');
    const inputFecha = document.getElementById('fecha');
    
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.min = hoy;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await procesarReserva();
    });

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => avanzarPaso(parseInt(btn.dataset.step)));
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => retrocederPaso(parseInt(btn.dataset.step)));
    });
}

function inicializarSelectores() {
    document.querySelectorAll('.persona-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.persona-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('personas').value = btn.dataset.value;
        });
    });

    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('hora').value = btn.dataset.value;
        });
    });
}

function avanzarPaso(step) {
    if (!validarPaso(step)) return;
    
    if (step === 2) {
        actualizarResumen();
    }

    currentStep = step + 1;
    mostrarPaso(currentStep);
}

function retrocederPaso(step) {
    currentStep = step - 1;
    mostrarPaso(currentStep);
}

function mostrarPaso(paso) {
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    document.querySelector(`[data-step="${paso}"]`).classList.add('active');

    document.querySelectorAll('.progress-step').forEach((step, index) => {
        step.classList.toggle('active', index < paso);
    });

    document.querySelectorAll('.progress-line').forEach((line, index) => {
        line.classList.toggle('active', index < paso - 1);
    });

    document.querySelector('.reservation-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validarPaso(paso) {
    const errores = [];

    if (paso === 1) {
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const personas = document.getElementById('personas').value;

        if (!nombre) errores.push('Por favor ingresa tu nombre');
        if (!email) errores.push('Por favor ingresa tu email');
        if (!validarEmail(email)) errores.push('Email inválido');
        if (!telefono) errores.push('Por favor ingresa tu teléfono');
        if (!personas) errores.push('Por favor selecciona cantidad de personas');
    }

    if (paso === 2) {
        const fecha = document.getElementById('fecha').value;
        const hora = document.getElementById('hora').value;

        if (!fecha) errores.push('Por favor selecciona una fecha');
        if (!hora) errores.push('Por favor selecciona una hora');
    }

    if (errores.length > 0) {
        mostrarError(errores.join(', '));
        return false;
    }

    return true;
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function actualizarResumen() {
    document.getElementById('summary-nombre').textContent = document.getElementById('nombre').value;
    document.getElementById('summary-email').textContent = document.getElementById('email').value;
    document.getElementById('summary-telefono').textContent = document.getElementById('telefono').value;
    document.getElementById('summary-personas').textContent = document.getElementById('personas').value + ' persona(s)';
    
    const fechaInput = document.getElementById('fecha').value;
    const fecha = new Date(fechaInput).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('summary-fecha').textContent = fecha;
    
    document.getElementById('summary-hora').textContent = document.getElementById('hora').value;
    
    const notas = document.getElementById('notas').value;
    if (notas) {
        document.getElementById('summary-notas-container').style.display = 'flex';
        document.getElementById('summary-notas').textContent = notas;
    } else {
        document.getElementById('summary-notas-container').style.display = 'none';
    }
}

async function procesarReserva() {
    if (!supabaseClient) {
        mostrarError('Configuración incompleta. Contacta al administrador.');
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';

    try {
        const datos = {
            restaurante_id: '550e8400-e29b-41d4-a716-446655440000',
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            personas: parseInt(document.getElementById('personas').value),
            nombre_cliente: document.getElementById('nombre').value,
            email_cliente: document.getElementById('email').value,
            telefono_cliente: document.getElementById('telefono').value,
            notas: document.getElementById('notas').value || null,
            estado: 'pendiente'
        };

        const { data, error } = await supabaseClient
            .from('dioxyz.reservas')
            .insert([datos])
            .select();

        if (error) throw error;

        console.log('✅ Reserva creada:', data);

        document.querySelector('.reserva-form-multistep').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';

    } catch (err) {
        console.error('Error:', err);
        mostrarError('Error al procesar: ' + err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar Reserva ✓';
    }
}

function mostrarError(mensaje) {
    const errorText = document.getElementById('errorText');
    const errorMessage = document.getElementById('errorMessage');
    const form = document.querySelector('.reserva-form-multistep');
    
    errorText.textContent = mensaje;
    errorMessage.style.display = 'block';
    form.style.display = 'none';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
        form.style.display = 'block';
    }, 5000);
}

function resetForm() {
    document.getElementById('reservaForm').reset();
    document.querySelectorAll('.persona-btn, .time-btn').forEach(btn => btn.classList.remove('active'));
    currentStep = 1;
    mostrarPaso(1);
    document.getElementById('errorMessage').style.display = 'none';
    document.querySelector('.reserva-form-multistep').style.display = 'block';
}

console.log('🌊 Don Or - Sistema de Reservas v2');
