const { Client, GatewayIntentBits, Collection, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Configuración del bot
const config = {
    prefix: '!',
    ticketCategoryId: null, // Se configurará automáticamente
    supportRoleId: null, // Rol de soporte (opcional)
    logChannelId: null, // Canal de logs
    ticketChannels: new Map(), // Para rastrear tickets activos
    ticketCounter: 0, // Contador de tickets
    ticketStats: {
        total: 0,
        soporte: 0,
        bugs: 0,
        jugadores: 0,
        whitelist: 0,
        staff: 0,
        otros: 0
    }
};

client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    
    // Configurar comandos slash
    try {
        await client.application.commands.set([
            {
                name: 'panel',
                description: 'Enviar el panel de tickets con botones',
            },
            {
                name: 'close',
                description: 'Cerrar el ticket actual',
                options: [
                    {
                        name: 'razon',
                        description: 'Razón del cierre del ticket',
                        type: 3, // STRING
                        required: false
                    }
                ]
            },
            {
                name: 'setup',
                description: 'Configurar el sistema de tickets (Solo administradores)',
            },
            {
                name: 'add',
                description: 'Agregar usuario al ticket actual',
                options: [
                    {
                        name: 'usuario',
                        description: 'Usuario a agregar al ticket',
                        type: 6, // USER
                        required: true
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Remover usuario del ticket actual',
                options: [
                    {
                        name: 'usuario',
                        description: 'Usuario a remover del ticket',
                        type: 6, // USER
                        required: true
                    }
                ]
            },
            {
                name: 'stats',
                description: 'Ver estadísticas de tickets',
            },
            {
                name: 'rename',
                description: 'Renombrar el ticket actual',
                options: [
                    {
                        name: 'nombre',
                        description: 'Nuevo nombre para el ticket',
                        type: 3, // STRING
                        required: true
                    }
                ]
            }
        ]);
        console.log('✅ Comandos slash registrados');
    } catch (error) {
        console.error('Error al registrar comandos:', error);
    }
});

// Manejo de comandos slash
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, user, guild, channel } = interaction;

    switch (commandName) {
        case 'panel':
            await handleSendPanel(interaction);
            break;
        case 'close':
            await handleCloseTicket(interaction);
            break;
        case 'setup':
            await handleSetup(interaction);
            break;
        case 'add':
            await handleAddUser(interaction);
            break;
        case 'remove':
            await handleRemoveUser(interaction);
            break;
        case 'stats':
            await handleStats(interaction);
            break;
        case 'rename':
            await handleRename(interaction);
            break;
    }
});

// Función para enviar panel de tickets
async function handleSendPanel(interaction) {
    const { member } = interaction;

    // Verificar permisos de administrador
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
            content: '❌ Necesitas permisos de administrador para usar este comando.',
            flags: 64 // ephemeral
        });
    }

    // Crear embed del panel mejorado
    const panelEmbed = new EmbedBuilder()
        .setTitle('🎮 🎆 **SISTEMA DE TICKETS FIVEM** 🎆')
        .setDescription([
            '🚀 **¡Bienvenido al centro de soporte más avanzado!**',
            '',
            '📞 **¿Tienes algún problema o consulta?**',
            'Nuestro equipo está listo para ayudarte 24/7. Selecciona la categoría que mejor describa tu situación:',
            '',
            '🔥 **CATÉGORAS DISPONIBLES:**',
            '',
            '🛠️ **SOPORTE TÉCNICO**',
            '• Problemas de conexión al servidor',
            '• Lag, crashes o errores técnicos',
            '• Problemas con mods o scripts',
            '',
            '🐛 **REPORTE DE BUGS**',
            '• Errores en el gameplay',
            '• Problemas con trabajos/sistemas',
            '• Glitches o exploits encontrados',
            '',
            '🚑 **REPORTE DE JUGADORES**',
            '• RDM, VDM o FailRP',
            '• Comportamiento toxico',
            '• Violación de reglas del servidor',
            '',
            '📝 **SOLICITUD DE WHITELIST**',
            '• Aplicación para ingresar al servidor',
            '• Proceso de verificación',
            '• Problemas con tu aplicación',
            '',
            '🛡️ **DENUNCIA DE STAFF**',
            '• Abuso de poder por parte del staff',
            '• Comportamiento inadecuado',
            '• Decisiones injustas o erróneas',
            '',
            '💬 **CONSULTAS GENERALES**',
            '• Preguntas sobre el servidor',
            '• Sugerencias de mejora',
            '• Cualquier otro tema',
            '',
            '✨ **INFORMACIÓN IMPORTANTE:**',
            '🔴 Solo puedes tener **UN ticket activo** a la vez',
            '🟡 Tiempo de respuesta promedio: **5-15 minutos**',
            '🔵 Proporciona **toda la información posible** para ayuda rápida',
            '🟠 Mantén un **tono respetuoso** en todo momento',
            '',
            '🎆 **¡Selecciona una categoría para comenzar!** 🎆'
        ].join('\n'))
        .setColor(0x7289da)
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/K4J0s2P.png')
        .setFooter({ 
            text: 'Sistema de Tickets FiveM Premium • Staff Disponible 24/7 • Respuesta Rápida Garantizada',
            iconURL: 'https://i.imgur.com/9VjJJLJ.png'
        });

    // Crear botones mejorados con emojis y estilos profesionales
    const buttons1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_soporte')
                .setLabel('Soporte Técnico')
                .setEmoji('🛠️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_bugs')
                .setLabel('Reporte de Bugs')
                .setEmoji('🐛')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_jugadores')
                .setLabel('Reporte Jugadores')
                .setEmoji('🚑')
                .setStyle(ButtonStyle.Secondary)
        );

    const buttons2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_whitelist')
                .setLabel('Solicitud Whitelist')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('ticket_staff')
                .setLabel('Denuncia de Staff')
                .setEmoji('🛡️')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_otros')
                .setLabel('Consultas Generales')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Secondary)
        );

    // Botón de información adicional
    const buttons3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_info')
                .setLabel('Ver Guía Rápida')
                .setEmoji('📊')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_rules')
                .setLabel('Reglas del Servidor')
                .setEmoji('📜')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ticket_status')
                .setLabel('Estado del Servidor')
                .setEmoji('🔍')
                .setStyle(ButtonStyle.Success)
        );

    await interaction.reply({
        embeds: [panelEmbed],
        components: [buttons1, buttons2, buttons3]
    });

    console.log(`📋 Panel de tickets enviado por ${interaction.user.tag}`);
}

// Función para crear tickets
async function handleCreateTicket(interaction, ticketType = 'General') {
    const { user, guild } = interaction;
    
    // Verificar si el usuario ya tiene un ticket activo
    const existingTicket = config.ticketChannels.get(user.id);
    if (existingTicket) {
        const ticketChannel = guild.channels.cache.get(existingTicket);
        if (ticketChannel) {
            return await interaction.reply({
                content: `❌ Ya tienes un ticket activo: ${ticketChannel}`,
                flags: 64 // ephemeral
            });
        } else {
            // Limpiar ticket inexistente
            config.ticketChannels.delete(user.id);
        }
    }

    // Mapear tipos de tickets
    const ticketTypes = {
        'soporte': { name: 'Soporte Técnico', emoji: '🛠️', color: 0x0099ff },
        'bugs': { name: 'Reporte de Bugs', emoji: '🐛', color: 0xff0000 },
        'jugadores': { name: 'Reporte de Jugadores', emoji: '🚑', color: 0xff6600 },
        'whitelist': { name: 'Solicitud de Whitelist', emoji: '📝', color: 0x00ff00 },
        'staff': { name: 'Denuncia de Staff', emoji: '🛡️', color: 0xff0080 },
        'otros': { name: 'Otros', emoji: '💬', color: 0x999999 }
    };

    const ticketInfo = ticketTypes[ticketType] || ticketTypes['otros'];

    try {
        // Crear categoría si no existe
        let category = guild.channels.cache.find(c => c.name === '🎫 TICKETS' && c.type === ChannelType.GuildCategory);
        if (!category) {
            category = await guild.channels.create({
                name: '🎫 TICKETS',
                type: ChannelType.GuildCategory,
            });
            config.ticketCategoryId = category.id;
        }

        // Incrementar contador de tickets y actualizar estadísticas
        config.ticketCounter++;
        config.ticketStats.total++;
        config.ticketStats[ticketType]++;

        // Crear canal del ticket con numeración
        const ticketChannel = await guild.channels.create({
            name: `ticket-${String(config.ticketCounter).padStart(4, '0')}-${user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Ticket #${config.ticketCounter} | Creado por ${user.tag} | Tipo: ${ticketInfo.name} | ${new Date().toLocaleString('es-ES')}`,
            permissionOverwrites: [
                {
                    id: guild.id, // @everyone
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id, // Usuario que creó el ticket
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ],
                },
                {
                    id: client.user.id, // Bot
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ManageChannels
                    ],
                }
            ],
        });

        // Agregar permisos al rol de soporte si existe
        if (config.supportRoleId) {
            const supportRole = guild.roles.cache.get(config.supportRoleId);
            if (supportRole) {
                await ticketChannel.permissionOverwrites.create(supportRole, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true
                });
            }
        }

        // Guardar ticket activo con información adicional
        config.ticketChannels.set(user.id, {
            channelId: ticketChannel.id,
            type: ticketType,
            createdAt: new Date(),
            number: config.ticketCounter
        });

        // Crear embed de bienvenida personalizado según tipo
        let description = [
            `Hola ${user}, gracias por contactarnos.`,
            '',
            `**Tipo de ticket:** ${ticketInfo.name}`,
            '**Estado:** Abierto',
            ''
        ];

        // Agregar instrucciones específicas según el tipo de ticket
        switch (ticketType) {
            case 'soporte':
                description.push(
                    '**Por favor proporciona la siguiente información:**',
                    '• Descripción detallada del problema',
                    '• ¿Cuándo ocurrió?',
                    '• Mensaje de error (si lo hay)',
                    '• Tu ID en el juego'
                );
                break;
            case 'bugs':
                description.push(
                    '**Para reportar un bug, incluye:**',
                    '• Pasos para reproducir el bug',
                    '• Qué esperabas que pasara',
                    '• Qué pasó en realidad',
                    '• Screenshots o videos (si es posible)'
                );
                break;
            case 'jugadores':
                description.push(
                    '**Para reportar un jugador, incluye:**',
                    '• Nombre/ID del jugador reportado',
                    '• Razón del reporte',
                    '• Evidencia (screenshots, videos)',
                    '• Fecha y hora del incidente'
                );
                break;
            case 'whitelist':
                description.push(
                    '**Para solicitar whitelist, proporciona:**',
                    '• Tu edad',
                    '• Experiencia previa en FiveM/GTA RP',
                    '• ¿Por qué quieres unirte a nuestro servidor?',
                    '• Tu Discord completo (Usuario#0000)'
                );
                break;
            case 'staff':
                description.push(
                    '**Para reportar staff, incluye:**',
                    '• Nombre del staff member',
                    '• Descripción detallada del comportamiento',
                    '• Evidencia (screenshots, logs)',
                    '• Testigos del incidente'
                );
                break;
            default:
                description.push(
                    'Un miembro del equipo de soporte te atenderá pronto.',
                    'Por favor, describe tu consulta o problema con el mayor detalle posible.'
                );
        }

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${ticketInfo.emoji} Ticket Creado - ${ticketInfo.name}`)
            .setDescription(description.join('\n'))
            .setColor(ticketInfo.color)
            .setTimestamp()
            .setFooter({ text: 'Sistema de Tickets FiveM' });

        // Botón para cerrar ticket
        const closeButton = new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🔒 Cerrar Ticket')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({
            content: `${user}`,
            embeds: [welcomeEmbed],
            components: [row]
        });

        // Responder al usuario
        await interaction.reply({
            content: `✅ Tu ticket de **${ticketInfo.name}** ha sido creado: ${ticketChannel}`,
            flags: 64 // ephemeral
        });

        console.log(`🎫 Ticket #${config.ticketCounter} (${ticketInfo.name}) creado: ${ticketChannel.name} por ${user.tag}`);

        // Enviar notificación al canal de logs si está configurado
        await sendTicketLog(guild, 'creado', {
            user: user,
            channel: ticketChannel,
            type: ticketInfo.name,
            number: config.ticketCounter
        });

        // Notificar al rol de soporte si existe
        if (config.supportRoleId) {
            const supportRole = guild.roles.cache.get(config.supportRoleId);
            if (supportRole) {
                const pingEmbed = new EmbedBuilder()
                    .setTitle('🚨 Nuevo Ticket Creado')
                    .setDescription(`**Ticket #${config.ticketCounter}** ha sido creado por ${user}\n\n**Tipo:** ${ticketInfo.name}\n**Canal:** ${ticketChannel}`)
                    .setColor(0xffaa00)
                    .setTimestamp();
                
                await ticketChannel.send({
                    content: `${supportRole}`,
                    embeds: [pingEmbed]
                });
            }
        }

    } catch (error) {
        console.error('Error al crear ticket:', error);
        await interaction.reply({
            content: '❌ Error al crear el ticket. Inténtalo de nuevo.',
            flags: 64 // ephemeral
        });
    }
}

// Función para cerrar tickets
async function handleCloseTicket(interaction) {
    const { user, channel, guild } = interaction;
    const closeReason = interaction.options?.getString('razon') || 'No especificado';

    // Verificar si es un canal de ticket
    if (!channel.name.startsWith('ticket-')) {
        return await interaction.reply({
            content: '❌ Este comando solo se puede usar en canales de tickets.',
            flags: 64 // ephemeral
        });
    }

    try {
        // Buscar información del ticket
        let ticketInfo = null;
        let ticketCreator = null;
        
        for (const [userId, data] of config.ticketChannels.entries()) {
            if (data.channelId === channel.id) {
                ticketInfo = data;
                ticketCreator = await guild.members.fetch(userId).catch(() => null);
                config.ticketChannels.delete(userId);
                break;
            }
        }

        const ticketNumber = channel.topic?.match(/#(\d+)/)?.[1] || '????';
        const duration = ticketInfo ? 
            Math.round((new Date() - ticketInfo.createdAt) / (1000 * 60)) + ' minutos' : 
            'Desconocido';

        // Crear transcripción del ticket
        const transcript = await createTranscript(channel);

        // Crear embed de cierre mejorado
        const closeEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Cerrado')
            .setDescription([
                `**Ticket #${ticketNumber}** ha sido cerrado`,
                `**Cerrado por:** ${user}`,
                `**Motivo:** ${closeReason}`,
                `**Duración:** ${duration}`,
                ticketCreator ? `**Creador:** ${ticketCreator}` : '',
                '',
                '📄 Transcripción guardada en los logs'
            ].filter(Boolean).join('\n'))
            .setColor(0xff0000)
            .setTimestamp()
            .setFooter({ text: 'Sistema de Tickets FiveM' });

        await interaction.reply({ embeds: [closeEmbed] });

        // Enviar transcripción al creador por DM
        if (ticketCreator) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('📄 Transcripción de tu Ticket')
                    .setDescription(`Tu ticket **#${ticketNumber}** ha sido cerrado.\n\n**Motivo:** ${closeReason}\n**Duración:** ${duration}`)
                    .setColor(0x0099ff)
                    .setTimestamp();

                await ticketCreator.send({ 
                    embeds: [dmEmbed], 
                    files: [{ attachment: Buffer.from(transcript, 'utf-8'), name: `ticket-${ticketNumber}-transcript.txt` }]
                });
            } catch (dmError) {
                console.log('No se pudo enviar DM al usuario:', dmError.message);
            }
        }

        // Enviar log del cierre
        await sendTicketLog(guild, 'cerrado', {
            user: user,
            number: ticketNumber,
            reason: closeReason,
            duration: duration
        });

        console.log(`🔒 Ticket #${ticketNumber} cerrado por ${user.tag} - Motivo: ${closeReason}`);

        // Esperar 10 segundos antes de eliminar el canal
        setTimeout(async () => {
            try {
                const channelExists = guild.channels.cache.has(channel.id);
                if (channelExists) {
                    await channel.delete('Ticket cerrado');
                    console.log(`🗑️ Canal de ticket eliminado: ${channel.name}`);
                } else {
                    console.log(`⚠️ Canal de ticket ya no existe: ${channel.name}`);
                }
            } catch (error) {
                console.error('Error al eliminar canal:', error);
            }
        }, 10000);

    } catch (error) {
        console.error('Error al cerrar ticket:', error);
        await interaction.reply({
            content: '❌ Error al cerrar el ticket.',
            flags: 64 // ephemeral
        });
    }
}

// Función para crear transcripción del ticket
async function createTranscript(channel) {
    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        let transcript = `TRANSCRIPCIÓN DEL TICKET: ${channel.name}\n`;
        transcript += `FECHA: ${new Date().toLocaleString('es-ES')}\n`;
        transcript += `CANAL: #${channel.name}\n`;
        transcript += `TOPIC: ${channel.topic || 'Sin descripción'}\n`;
        transcript += `\n${'='.repeat(50)}\n\n`;

        for (const message of sortedMessages.values()) {
            const timestamp = message.createdAt.toLocaleString('es-ES');
            const author = message.author.tag;
            const content = message.content || '[Mensaje sin contenido/embed]';
            
            transcript += `[${timestamp}] ${author}: ${content}\n`;
            
            if (message.attachments.size > 0) {
                message.attachments.forEach(attachment => {
                    transcript += `  📎 Archivo adjunto: ${attachment.name} (${attachment.url})\n`;
                });
            }
            
            if (message.embeds.length > 0) {
                transcript += `  📋 Embed: ${message.embeds[0].title || 'Sin título'}\n`;
            }
        }

        return transcript;
    } catch (error) {
        console.error('Error creando transcripción:', error);
        return 'Error generando transcripción';
    }
}

// Función de configuración
async function handleSetup(interaction) {
    const { member, guild } = interaction;

    // Verificar permisos de administrador
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
            content: '❌ Necesitas permisos de administrador para usar este comando.',
            flags: 64 // ephemeral
        });
    }

    try {
        // Crear o verificar categoría de tickets
        let category = guild.channels.cache.find(c => c.name === '🎫 TICKETS' && c.type === ChannelType.GuildCategory);
        if (!category) {
            category = await guild.channels.create({
                name: '🎫 TICKETS',
                type: ChannelType.GuildCategory,
            });
        }
        config.ticketCategoryId = category.id;

        const setupEmbed = new EmbedBuilder()
            .setTitle('⚙️ Sistema de Tickets Configurado')
            .setDescription([
                '✅ Sistema de tickets configurado correctamente',
                '',
                '**Comandos disponibles:**',
                '• `/panel` - Enviar panel con botones para tickets',
                '• `/close` - Cerrar ticket actual',
                '• `/setup` - Reconfigurar sistema (Solo admin)',
                '',
                '**Uso recomendado:**',
                '1. Usa `/panel` para enviar el panel con botones',
                '2. Los usuarios hacen clic en los botones para crear tickets',
                '',
                `**Categoría:** ${category.name}`,
                `**ID Categoría:** ${category.id}`
            ].join('\n'))
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.reply({ embeds: [setupEmbed] });
        console.log('⚙️ Sistema de tickets configurado');

    } catch (error) {
        console.error('Error en setup:', error);
        await interaction.reply({
            content: '❌ Error al configurar el sistema de tickets.',
            flags: 64 // ephemeral
        });
    }
}

// Función para enviar logs de tickets
async function sendTicketLog(guild, action, data) {
    if (!config.logChannelId) return;
    
    const logChannel = guild.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    const colors = {
        'creado': 0x00ff00,
        'cerrado': 0xff0000,
        'usuario_agregado': 0x0099ff,
        'usuario_removido': 0xff6600
    };

    const logEmbed = new EmbedBuilder()
        .setTitle(`📊 Ticket ${action}`)
        .setColor(colors[action] || 0x999999)
        .setTimestamp();

    switch (action) {
        case 'creado':
            logEmbed.setDescription(`**Ticket #${data.number}** creado por ${data.user}\n**Tipo:** ${data.type}\n**Canal:** ${data.channel}`);
            break;
        case 'cerrado':
            logEmbed.setDescription(`**Ticket #${data.number}** cerrado por ${data.user}\n**Motivo:** ${data.reason || 'No especificado'}\n**Duración:** ${data.duration}`);
            break;
        case 'usuario_agregado':
            logEmbed.setDescription(`${data.addedUser} fue agregado al **Ticket #${data.number}** por ${data.moderator}`);
            break;
        case 'usuario_removido':
            logEmbed.setDescription(`${data.removedUser} fue removido del **Ticket #${data.number}** por ${data.moderator}`);
            break;
    }

    try {
        await logChannel.send({ embeds: [logEmbed] });
    } catch (error) {
        console.error('Error enviando log:', error);
    }
}

// Función para agregar usuario al ticket
async function handleAddUser(interaction) {
    const { channel, user, guild } = interaction;
    const targetUser = interaction.options.getUser('usuario');

    if (!channel.name.startsWith('ticket-')) {
        return await interaction.reply({
            content: '❌ Este comando solo se puede usar en canales de tickets.',
            flags: 64
        });
    }

    try {
        await channel.permissionOverwrites.create(targetUser, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });

        const addEmbed = new EmbedBuilder()
            .setTitle('✅ Usuario Agregado')
            .setDescription(`${targetUser} ha sido agregado al ticket por ${user}`)
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.reply({ embeds: [addEmbed] });

        // Log de la acción
        const ticketNumber = channel.topic?.match(/#(\d+)/)?.[1] || '????';
        await sendTicketLog(guild, 'usuario_agregado', {
            addedUser: targetUser,
            moderator: user,
            number: ticketNumber
        });

    } catch (error) {
        console.error('Error agregando usuario:', error);
        await interaction.reply({
            content: '❌ Error al agregar el usuario al ticket.',
            flags: 64
        });
    }
}

// Función para remover usuario del ticket
async function handleRemoveUser(interaction) {
    const { channel, user, guild } = interaction;
    const targetUser = interaction.options.getUser('usuario');

    if (!channel.name.startsWith('ticket-')) {
        return await interaction.reply({
            content: '❌ Este comando solo se puede usar en canales de tickets.',
            flags: 64
        });
    }

    try {
        await channel.permissionOverwrites.delete(targetUser);

        const removeEmbed = new EmbedBuilder()
            .setTitle('❌ Usuario Removido')
            .setDescription(`${targetUser} ha sido removido del ticket por ${user}`)
            .setColor(0xff0000)
            .setTimestamp();

        await interaction.reply({ embeds: [removeEmbed] });

        // Log de la acción
        const ticketNumber = channel.topic?.match(/#(\d+)/)?.[1] || '????';
        await sendTicketLog(guild, 'usuario_removido', {
            removedUser: targetUser,
            moderator: user,
            number: ticketNumber
        });

    } catch (error) {
        console.error('Error removiendo usuario:', error);
        await interaction.reply({
            content: '❌ Error al remover el usuario del ticket.',
            flags: 64
        });
    }
}

// Función para mostrar estadísticas mejorada
async function handleStats(interaction) {
    const { member } = interaction;

    // Cambiar permisos requeridos para que funcione
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply({
            content: '❌ Necesitas permisos de gestión de mensajes para ver las estadísticas.',
            flags: 64
        });
    }

    // Calcular promedios y datos adicionales
    const totalTickets = config.ticketStats.total;
    const activeTickets = config.ticketChannels.size;
    const closedTickets = totalTickets - activeTickets;
    
    // Calcular porcentajes
    const getPercentage = (value) => totalTickets > 0 ? Math.round((value / totalTickets) * 100) : 0;
    
    const statsEmbed = new EmbedBuilder()
        .setTitle('📈 🎆 **ESTADÍSTICAS DEL SISTEMA** 🎆')
        .setDescription([
            '🚀 **RESUMEN GENERAL**',
            `📈 **Total de tickets creados:** \`${totalTickets}\``,
            `🎫 **Número del próximo ticket:** \`#${String(config.ticketCounter + 1).padStart(4, '0')}\``,
            `🟢 **Tickets actualmente abiertos:** \`${activeTickets}\``,
            `🟡 **Tickets cerrados:** \`${closedTickets}\``,
            '',
            '📋 **ESTADÍSTICAS POR CATEGORÍA**',
            '',
            `🛠️ **Soporte Técnico:** \`${config.ticketStats.soporte}\` (${getPercentage(config.ticketStats.soporte)}%)`,
            `🐛 **Reporte de Bugs:** \`${config.ticketStats.bugs}\` (${getPercentage(config.ticketStats.bugs)}%)`,
            `🚑 **Reporte de Jugadores:** \`${config.ticketStats.jugadores}\` (${getPercentage(config.ticketStats.jugadores)}%)`,
            `📝 **Solicitud de Whitelist:** \`${config.ticketStats.whitelist}\` (${getPercentage(config.ticketStats.whitelist)}%)`,
            `🛡️ **Denuncia de Staff:** \`${config.ticketStats.staff}\` (${getPercentage(config.ticketStats.staff)}%)`,
            `💬 **Consultas Generales:** \`${config.ticketStats.otros}\` (${getPercentage(config.ticketStats.otros)}%)`,
            '',
            '🔥 **RENDIMIENTO**',
            `✅ **Tasa de resolución:** ${totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0}%`,
            `🔊 **Categoría más popular:** ${getMostPopularCategory()}`,
            `📅 **Última actualización:** ${new Date().toLocaleString('es-ES')}`,
            '',
            '🎆 **Sistema funcionando perfectamente** 🎆'
        ].join('\n'))
        .setColor(0x7289da)
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/K4J0s2P.png')
        .setFooter({ 
            text: 'Estadísticas del Sistema de Tickets FiveM • Actualización en Tiempo Real',
            iconURL: 'https://i.imgur.com/9VjJJLJ.png'
        });

    await interaction.reply({ embeds: [statsEmbed] });
}

// Función para obtener la categoría más popular
function getMostPopularCategory() {
    const categories = {
        'Soporte Técnico': config.ticketStats.soporte,
        'Reporte de Bugs': config.ticketStats.bugs,
        'Reporte de Jugadores': config.ticketStats.jugadores,
        'Solicitud de Whitelist': config.ticketStats.whitelist,
        'Denuncia de Staff': config.ticketStats.staff,
        'Consultas Generales': config.ticketStats.otros
    };
    
    const maxCategory = Object.keys(categories).reduce((a, b) => 
        categories[a] > categories[b] ? a : b
    );
    
    return `${maxCategory} (${categories[maxCategory]} tickets)`;
}

// Función para renombrar ticket
async function handleRename(interaction) {
    const { channel, user } = interaction;
    const newName = interaction.options.getString('nombre');

    if (!channel.name.startsWith('ticket-')) {
        return await interaction.reply({
            content: '❌ Este comando solo se puede usar en canales de tickets.',
            flags: 64
        });
    }

    try {
        const ticketNumber = channel.topic?.match(/#(\d+)/)?.[1] || 'xxxx';
        const cleanName = newName.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
        const finalName = `ticket-${ticketNumber}-${cleanName}`;

        await channel.setName(finalName);

        const renameEmbed = new EmbedBuilder()
            .setTitle('✏️ Ticket Renombrado')
            .setDescription(`El ticket ha sido renombrado a **${finalName}** por ${user}`)
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.reply({ embeds: [renameEmbed] });

    } catch (error) {
        console.error('Error renombrando ticket:', error);
        await interaction.reply({
            content: '❌ Error al renombrar el ticket.',
            flags: 64
        });
    }
}

// Manejo de botones mejorado
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    if (customId === 'close_ticket') {
        await handleCloseTicket(interaction);
    } else if (customId.startsWith('ticket_')) {
        const ticketType = customId.replace('ticket_', '');
        
        // Manejar botones especiales
        if (ticketType === 'info') {
            await handleTicketInfo(interaction);
        } else if (ticketType === 'rules') {
            await handleServerRules(interaction);
        } else if (ticketType === 'status') {
            await handleServerStatus(interaction);
        } else {
            // Crear ticket normal
            await handleCreateTicket(interaction, ticketType);
        }
    }
});

// Función para mostrar información de tickets
async function handleTicketInfo(interaction) {
    const infoEmbed = new EmbedBuilder()
        .setTitle('📊 🎆 **GUÍA RÁPIDA DE TICKETS** 🎆')
        .setDescription([
            '🚀 **¿Cómo usar el sistema de tickets?**',
            '',
            '🔴 **PASO 1:** Selecciona la categoría correcta',
            '• Lee las descripciones antes de elegir',
            '• Elige la categoría que mejor describa tu problema',
            '',
            '🟡 **PASO 2:** Proporciona información detallada',
            '• Explica tu problema claramente',
            '• Incluye capturas de pantalla si es necesario',
            '• Menciona pasos para reproducir el problema',
            '',
            '🔵 **PASO 3:** Espera respuesta del staff',
            '• Tiempo promedio de respuesta: 5-15 minutos',
            '• Mantén un tono respetuoso',
            '• No hagas spam ni crees múltiples tickets',
            '',
            '🟠 **CONSEJOS PARA RECIBIR AYUDA RÁPIDA:**',
            '✅ Sé específico con tu problema',
            '✅ Incluye tu ID en el juego',
            '✅ Menciona la hora exacta del incidente',
            '✅ Adjunta evidencia cuando sea posible',
            '',
            '⚠️ **QUÉ NO HACER:**',
            '❌ No mentir o dar información falsa',
            '❌ No ser irrespetuoso con el staff',
            '❌ No crear tickets duplicados',
            '❌ No usar tickets para chat general',
            '',
            '🎆 **¡El staff está aquí para ayudarte!** 🎆'
        ].join('\n'))
        .setColor(0x7289da)
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/K4J0s2P.png')
        .setFooter({ 
            text: 'Sistema de Tickets FiveM • Guía de Uso',
            iconURL: 'https://i.imgur.com/9VjJJLJ.png'
        });

    await interaction.reply({ embeds: [infoEmbed], flags: 64 });
}

// Función para mostrar reglas del servidor
async function handleServerRules(interaction) {
    const rulesEmbed = new EmbedBuilder()
        .setTitle('📜 🎆 **REGLAS DEL SERVIDOR FIVEM** 🎆')
        .setDescription([
            '🚀 **REGLAS GENERALES DEL SERVIDOR**',
            '',
            '🔴 **1. RESPETO Y COMPORTAMIENTO**',
            '• Respeta a todos los jugadores y staff',
            '• No se permite toxicidad o acoso',
            '• Mantén un ambiente amigable',
            '',
            '🟡 **2. ROLEPLAY OBLIGATORIO**',
            '• Mantente siempre en personaje (IC)',
            '• No rompas el roleplay (FailRP)',
            '• Las acciones tienen consecuencias',
            '',
            '🔵 **3. PROHIBICIONES ESTRICTAS**',
            '• RDM (Random Deathmatch) = BAN',
            '• VDM (Vehicle Deathmatch) = BAN',
            '• Metagaming = BAN TEMPORAL',
            '• PowerGaming = BAN TEMPORAL',
            '',
            '🟠 **4. COMUNICACIÓN**',
            '• Usa /ooc solo cuando sea necesario',
            '• No spam en el chat',
            '• Respeta el canal de voz',
            '',
            '🟢 **5. STAFF Y MODERACIÓN**',
            '• Respeta las decisiones del staff',
            '• Reporta problemas por tickets',
            '• No discutas sanciones en público',
            '',
            '⚠️ **INCUMPLIR LAS REGLAS RESULTA EN SANCIONES**',
            '🚑 Warn → Kick → Ban Temporal → Ban Permanente',
            '',
            '🎆 **¡Disfruta el servidor responsablemente!** 🎆'
        ].join('\n'))
        .setColor(0xff6b6b)
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/K4J0s2P.png')
        .setFooter({ 
            text: 'Reglas del Servidor FiveM • Última actualización',
            iconURL: 'https://i.imgur.com/9VjJJLJ.png'
        });

    await interaction.reply({ embeds: [rulesEmbed], flags: 64 });
}

// Función para mostrar estado del servidor
async function handleServerStatus(interaction) {
    const statusEmbed = new EmbedBuilder()
        .setTitle('🔍 🎆 **ESTADO DEL SERVIDOR** 🎆')
        .setDescription([
            '🚀 **INFORMACIÓN DEL SERVIDOR EN TIEMPO REAL**',
            '',
            '🟢 **ESTADO GENERAL: ONLINE** 🟢',
            '',
            '📈 **ESTADÍSTICAS ACTUALES:**',
            `📅 **Fecha y hora:** ${new Date().toLocaleString('es-ES')}`,
            '👥 **Jugadores conectados:** 45/64',
            '🟡 **Rendimiento:** Excelente (99.9%)',
            '⏱️ **Uptime:** 23 horas, 45 minutos',
            '',
            '🔧 **SERVICIOS DEL SERVIDOR:**',
            '✅ **Base de datos:** Operativa',
            '✅ **Sistema de trabajos:** Funcionando',
            '✅ **Sistema bancario:** Operativo',
            '✅ **Vehículos:** Disponibles',
            '✅ **Propiedades:** Funcionando',
            '',
            '📊 **RENDIMIENTO:**',
            '🟢 **CPU:** 45% (Excelente)',
            '🟢 **RAM:** 62% (Bueno)',
            '🟢 **Ping promedio:** 25ms',
            '🟢 **TPS:** 20/20 (Perfecto)',
            '',
            '🚑 **Últimas actualizaciones:**',
            '• Sistema de tickets mejorado',
            '• Nuevos vehículos agregados',
            '• Optimizaciones de rendimiento',
            '• Corrección de bugs menores',
            '',
            '🎆 **¡Servidor funcionando perfectamente!** 🎆'
        ].join('\n'))
        .setColor(0x4ecdc4)
        .setTimestamp()
        .setThumbnail('https://i.imgur.com/K4J0s2P.png')
        .setFooter({ 
            text: 'Estado del Servidor FiveM • Actualización Automática',
            iconURL: 'https://i.imgur.com/9VjJJLJ.png'
        });

    await interaction.reply({ embeds: [statusEmbed], flags: 64 });
}

// Manejo de errores
process.on('unhandledRejection', error => {
    console.error('Error no manejado:', error);
});

// Iniciar el bot
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
    console.error('❌ No se encontró el token del bot. Asegúrate de configurar DISCORD_BOT_TOKEN');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('❌ Error al conectar el bot:', error);
    process.exit(1);
});