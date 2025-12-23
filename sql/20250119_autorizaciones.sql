-- Autorizaciones y compras externas (proveedores externos)

-- Proveedores: rubro (si no existe)
ALTER TABLE proveedores
    ADD COLUMN IF NOT EXISTS rubro text;

-- Ordenes de trabajo: monto externo y marca de confirmacion
ALTER TABLE ordenes_trabajo
    ADD COLUMN IF NOT EXISTS external_amount numeric(12,2),
    ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- Compras: vínculo con OT y monto
ALTER TABLE compras
    ADD COLUMN IF NOT EXISTS work_order_id uuid REFERENCES ordenes_trabajo(id),
    ADD COLUMN IF NOT EXISTS monto numeric(12,2),
    ADD COLUMN IF NOT EXISTS origen text,
    ADD COLUMN IF NOT EXISTS origen_detalle text;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'compras_estado_check'
    ) THEN
        ALTER TABLE compras
            ADD CONSTRAINT compras_estado_check
            CHECK (estado IN ('borrador', 'PENDING_N1', 'PENDING_N3', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

-- Perfiles de autorizacion
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text,
    can_authorize boolean DEFAULT false,
    authorization_level integer CHECK (authorization_level IN (1, 3)),
    active boolean DEFAULT true,
    email text UNIQUE
);

CREATE TABLE IF NOT EXISTS authorization_config (
    id boolean PRIMARY KEY DEFAULT true,
    authorizer_n1 uuid REFERENCES profiles(id),
    authorizer_n3 uuid REFERENCES profiles(id)
);

INSERT INTO authorization_config (id)
VALUES (true)
ON CONFLICT (id) DO NOTHING;

-- Registro de decisiones
CREATE TABLE IF NOT EXISTS purchase_authorizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id uuid REFERENCES compras(id) ON DELETE CASCADE,
    action text NOT NULL,
    notes text,
    actor_id uuid REFERENCES profiles(id),
    origen text,
    origen_detalle text,
    created_at timestamptz DEFAULT now()
);

-- Cola de emails
CREATE TABLE IF NOT EXISTS email_outbox (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    attachment_url text,
    attachment_name text,
    attachment_mime text,
    status text NOT NULL DEFAULT 'PENDING',
    attempts integer NOT NULL DEFAULT 0,
    last_error text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'email_outbox_status_check'
    ) THEN
        ALTER TABLE email_outbox
            ADD CONSTRAINT email_outbox_status_check
            CHECK (status IN ('PENDING', 'SENT', 'FAILED'));
    END IF;
END $$;

-- Funciones auxiliares
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
          AND p.active
    );
$$;

-- RPC: crear compra externa desde OT
CREATE OR REPLACE FUNCTION create_external_purchase_from_work_order(wo_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    wo record;
    purchase_id uuid;
    n1_id uuid;
    n1_email text;
    wo_label text;
    proveedor_nombre text;
    vehiculo_label text;
    body_html text;
BEGIN
    SELECT * INTO wo FROM ordenes_trabajo WHERE id = wo_id;
    IF wo IS NULL THEN
        RAISE EXCEPTION 'OT no encontrada';
    END IF;

    IF wo.proveedor_id IS NULL THEN
        RAISE EXCEPTION 'OT sin proveedor';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM proveedores p WHERE p.id = wo.proveedor_id AND p.es_externo
    ) THEN
        RAISE EXCEPTION 'Proveedor no externo';
    END IF;

    IF COALESCE(wo.external_amount, 0) <= 0 THEN
        RAISE EXCEPTION 'external_amount obligatorio';
    END IF;

    SELECT id INTO purchase_id FROM compras WHERE work_order_id = wo_id LIMIT 1;
    IF purchase_id IS NULL THEN
        wo_label := COALESCE(wo.numero::text, wo_id::text);
        INSERT INTO compras (proveedor_id, fecha, observaciones, estado, work_order_id, monto)
        VALUES (
            wo.proveedor_id,
            CURRENT_DATE,
            CONCAT('Generado desde OT ', wo_label),
            'PENDING_N1',
            wo_id,
            wo.external_amount
        )
        RETURNING id INTO purchase_id;

        UPDATE compras
        SET origen = 'OT',
            origen_detalle = CONCAT('Orden de trabajo ', wo_label)
        WHERE id = purchase_id;
    END IF;

    UPDATE ordenes_trabajo
    SET estado = 'confirmada',
        confirmed_at = now()
    WHERE id = wo_id;

    SELECT authorizer_n1 INTO n1_id FROM authorization_config WHERE id = true;
    SELECT email INTO n1_email FROM profiles WHERE id = n1_id;

    IF n1_email IS NOT NULL THEN
        SELECT nombre INTO proveedor_nombre FROM proveedores WHERE id = wo.proveedor_id;
        SELECT CONCAT_WS(' ', patente, marca, modelo) INTO vehiculo_label FROM vehiculos WHERE id = wo.vehiculo_id;
        body_html := CONCAT(
            '<p><strong>Compra pendiente de autorizacion N1</strong></p>',
            '<p><strong>OT:</strong> ', wo_label, '</p>',
            '<p><strong>Tipo:</strong> ', COALESCE(wo.titulo, '-'), '</p>',
            '<p><strong>Descripcion:</strong> ', COALESCE(wo.descripcion, '-'), '</p>',
            '<p><strong>Prioridad:</strong> ', COALESCE(wo.prioridad, '-'), '</p>',
            '<p><strong>Vehiculo:</strong> ', COALESCE(vehiculo_label, '-'), '</p>',
            '<p><strong>Proveedor:</strong> ', COALESCE(proveedor_nombre, '-'), '</p>',
            '<p><strong>Monto externo:</strong> ', COALESCE(wo.external_amount::text, '-'), '</p>',
            '<p><strong>Id OT:</strong> ', wo_id::text, '</p>',
            CASE
                WHEN wo.presupuesto_url IS NOT NULL THEN CONCAT('<p><strong>Presupuesto:</strong> <a href=\"', wo.presupuesto_url, '\">Ver archivo</a></p>')
                ELSE ''
            END,
            '<p>Ingrese al panel para autorizar.</p>'
        );
        INSERT INTO email_outbox (to_email, subject, body, attachment_url, attachment_name, status)
        VALUES (
            n1_email,
            'Compra pendiente N1',
            body_html,
            wo.presupuesto_url,
            CASE
                WHEN wo.presupuesto_url IS NOT NULL THEN CONCAT('presupuesto_ot_', wo_label, '.pdf')
                ELSE NULL
            END,
            'PENDING'
        );
    END IF;

    RETURN purchase_id;
END;
$$;

-- RPC: autorizar compra
CREATE OR REPLACE FUNCTION authorize_purchase(purchase_id uuid, action text, notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    p record;
    prof record;
    next_status text;
    n3_id uuid;
    n3_email text;
    wo_label text;
    proveedor_nombre text;
    vehiculo_label text;
    body_html text;
BEGIN
    SELECT * INTO p FROM compras WHERE id = purchase_id;
    IF p IS NULL THEN
        RAISE EXCEPTION 'Compra no encontrada';
    END IF;

    IF p.work_order_id IS NOT NULL THEN
        SELECT COALESCE(wo.numero::text, wo.id::text)
        INTO wo_label
        FROM ordenes_trabajo wo
        WHERE wo.id = p.work_order_id;
    END IF;

    SELECT * INTO prof
    FROM profiles
    WHERE id = auth.uid()
      AND active
      AND can_authorize;

    IF prof IS NULL THEN
        RAISE EXCEPTION 'Sin permisos de autorizacion';
    END IF;

    action := upper(action);

    IF p.estado = 'PENDING_N1' THEN
        IF prof.authorization_level <> 1 THEN
            RAISE EXCEPTION 'No es autorizador N1';
        END IF;
        IF action = 'DERIVE' THEN
            next_status := 'PENDING_N3';
        ELSIF action = 'APPROVE' THEN
            next_status := 'APPROVED';
        ELSIF action = 'REJECT' THEN
            next_status := 'REJECTED';
        ELSE
            RAISE EXCEPTION 'Acción inválida';
        END IF;
    ELSIF p.estado = 'PENDING_N3' THEN
        IF prof.authorization_level <> 3 THEN
            RAISE EXCEPTION 'No es autorizador N3';
        END IF;
        IF action = 'APPROVE' THEN
            next_status := 'APPROVED';
        ELSIF action = 'REJECT' THEN
            next_status := 'REJECTED';
        ELSE
            RAISE EXCEPTION 'Acción inválida';
        END IF;
    ELSE
        RAISE EXCEPTION 'Estado no autorizable';
    END IF;

    PERFORM set_config('app.rpc', 'authorize_purchase', true);
    UPDATE compras SET estado = next_status WHERE id = purchase_id;

    INSERT INTO purchase_authorizations (purchase_id, action, notes, actor_id, origen, origen_detalle)
    VALUES (
        purchase_id,
        action,
        notes,
        prof.id,
        'AUTORIZACION',
        CASE
            WHEN wo_label IS NOT NULL THEN CONCAT('Compra desde OT ', wo_label)
            ELSE CONCAT('Compra ', purchase_id::text)
        END
    );

    IF next_status = 'PENDING_N3' THEN
        SELECT authorizer_n3 INTO n3_id FROM authorization_config WHERE id = true;
        SELECT email INTO n3_email FROM profiles WHERE id = n3_id;
        IF n3_email IS NOT NULL THEN
            SELECT nombre INTO proveedor_nombre FROM proveedores WHERE id = p.proveedor_id;
            SELECT CONCAT_WS(' ', patente, marca, modelo) INTO vehiculo_label
            FROM vehiculos
            WHERE id = (SELECT vehiculo_id FROM ordenes_trabajo WHERE id = p.work_order_id);
            body_html := CONCAT(
                '<p><strong>Compra pendiente de autorizacion N3</strong></p>',
                CASE
                    WHEN wo_label IS NOT NULL THEN CONCAT('<p><strong>OT:</strong> ', wo_label, '</p>')
                    ELSE '<p><strong>OT:</strong> -</p>'
                END,
                '<p><strong>Proveedor:</strong> ', COALESCE(proveedor_nombre, '-'), '</p>',
                '<p><strong>Vehiculo:</strong> ', COALESCE(vehiculo_label, '-'), '</p>',
                CASE
                    WHEN p.work_order_id IS NOT NULL THEN CONCAT('<p><strong>Id OT:</strong> ', p.work_order_id::text, '</p>')
                    ELSE ''
                END,
                '<p>Ingrese al panel para autorizar.</p>'
            );
            INSERT INTO email_outbox (to_email, subject, body, attachment_url, attachment_name, status)
            VALUES (
                n3_email,
                'Compra pendiente N3',
                body_html,
                (SELECT presupuesto_url FROM ordenes_trabajo WHERE id = p.work_order_id),
                CASE
                    WHEN wo_label IS NOT NULL THEN CONCAT('presupuesto_ot_', wo_label, '.pdf')
                    ELSE NULL
                END,
                'PENDING'
            );
        END IF;
    END IF;
END;
$$;

-- Restringir cambios de estado fuera de RPC
CREATE OR REPLACE FUNCTION prevent_compras_estado_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.estado IS DISTINCT FROM OLD.estado AND current_setting('app.rpc', true) IS NULL THEN
        RAISE EXCEPTION 'Use RPC authorize_purchase para cambiar estado';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'compras_prevent_estado_change'
    ) THEN
        CREATE TRIGGER compras_prevent_estado_change
        BEFORE UPDATE ON compras
        FOR EACH ROW
        EXECUTE FUNCTION prevent_compras_estado_change();
    END IF;
END $$;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorization_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_authorizations ENABLE ROW LEVEL SECURITY;

-- Policies perfiles/config (solo admin modifica)
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select
ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS profiles_admin_write ON profiles;
CREATE POLICY profiles_admin_write
ON profiles FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS authorization_config_select ON authorization_config;
CREATE POLICY authorization_config_select
ON authorization_config FOR SELECT
USING (is_admin());

DROP POLICY IF EXISTS authorization_config_admin_write ON authorization_config;
CREATE POLICY authorization_config_admin_write
ON authorization_config FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policies purchase_authorizations
DROP POLICY IF EXISTS purchase_authorizations_select ON purchase_authorizations;
CREATE POLICY purchase_authorizations_select
ON purchase_authorizations FOR SELECT
USING (is_admin() OR auth.uid() = actor_id);

DROP POLICY IF EXISTS purchase_authorizations_admin_write ON purchase_authorizations;
CREATE POLICY purchase_authorizations_admin_write
ON purchase_authorizations FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policies email_outbox (solo admin)
DROP POLICY IF EXISTS email_outbox_admin ON email_outbox;
CREATE POLICY email_outbox_admin
ON email_outbox FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
