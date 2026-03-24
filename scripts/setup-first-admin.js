import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupFirstAdmin() {
  try {
    console.log('Limpiando usuarios existentes...');
    
    // Obtener todos los usuarios
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listando usuarios:', listError);
      return;
    }

    // Eliminar cada usuario
    for (const user of users.users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Error eliminando usuario ${user.email}:`, deleteError);
      } else {
        console.log(`✓ Usuario ${user.email} eliminado`);
      }
    }

    console.log('\n✓ Todos los usuarios han sido eliminados\n');
    console.log('Creando primer admin: admin@condoapp.com...');

    // Crear nuevo usuario admin
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@condoapp.com',
      password: 'Admin123!@#',
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        first_name: 'Admin',
        last_name: 'Sistema',
        role: 'admin',
      },
    });

    if (createError) {
      console.error('Error creando admin:', createError);
      return;
    }

    console.log('✓ Usuario admin creado:', newUser.user.email);
    console.log('\n📋 CREDENCIALES DEL ADMIN:');
    console.log('   Email: admin@condoapp.com');
    console.log('   Password: Admin123!@#');
    console.log('\n⚠️  POR FAVOR CAMBIA LA CONTRASEÑA EN TU PRIMER LOGIN\n');
  } catch (error) {
    console.error('Error:', error);
  }
}

setupFirstAdmin();
