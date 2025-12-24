-- Create provider_availability table for managing available time slots
CREATE TABLE IF NOT EXISTS public.provider_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    date DATE NOT NULL,
    time_slot TIME NOT NULL,
    datetime TIMESTAMPTZ NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_booked BOOLEAN DEFAULT false,
    booking_id UUID,
    duration_minutes INTEGER DEFAULT 60,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, datetime)
);

-- Create indexes
CREATE INDEX idx_provider_availability_provider_id ON public.provider_availability(provider_id);
CREATE INDEX idx_provider_availability_date ON public.provider_availability(date);
CREATE INDEX idx_provider_availability_datetime ON public.provider_availability(datetime);
CREATE INDEX idx_provider_availability_is_available ON public.provider_availability(is_available);
CREATE INDEX idx_provider_availability_is_booked ON public.provider_availability(is_booked);

-- Enable Row Level Security
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view available slots
CREATE POLICY "provider_availability_public_select"
    ON public.provider_availability
    FOR SELECT
    USING (is_available = true);

-- Policy: Providers can manage their own availability
CREATE POLICY "provider_availability_provider_all"
    ON public.provider_availability
    FOR ALL
    TO authenticated
    USING (provider_id IN (
        SELECT id FROM public.providers WHERE user_id = auth.uid()
    ))
    WITH CHECK (provider_id IN (
        SELECT id FROM public.providers WHERE user_id = auth.uid()
    ));

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_provider_availability_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_provider_availability_updated_at
    BEFORE UPDATE ON public.provider_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_provider_availability_updated_at();

-- Function to automatically generate availability slots for a provider
CREATE OR REPLACE FUNCTION public.generate_provider_availability(
    p_provider_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_start_time TIME DEFAULT '09:00:00',
    p_end_time TIME DEFAULT '17:00:00',
    p_slot_duration_minutes INTEGER DEFAULT 60,
    p_days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5] -- Monday to Friday
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_date DATE;
    current_time TIME;
    current_datetime TIMESTAMPTZ;
    slots_created INTEGER := 0;
BEGIN
    current_date := p_start_date;

    WHILE current_date <= p_end_date LOOP
        -- Check if this day of week should have availability
        IF EXTRACT(ISODOW FROM current_date)::INTEGER = ANY(p_days_of_week) THEN
            current_time := p_start_time;

            WHILE current_time < p_end_time LOOP
                current_datetime := (current_date || ' ' || current_time)::TIMESTAMPTZ;

                -- Only create slots for future times
                IF current_datetime > NOW() THEN
                    INSERT INTO public.provider_availability (
                        provider_id,
                        date,
                        time_slot,
                        datetime,
                        duration_minutes,
                        is_available,
                        is_booked
                    )
                    VALUES (
                        p_provider_id,
                        current_date,
                        current_time,
                        current_datetime,
                        p_slot_duration_minutes,
                        true,
                        false
                    )
                    ON CONFLICT (provider_id, datetime) DO NOTHING;

                    slots_created := slots_created + 1;
                END IF;

                -- Move to next time slot
                current_time := current_time + (p_slot_duration_minutes || ' minutes')::INTERVAL;
            END LOOP;
        END IF;

        current_date := current_date + 1;
    END LOOP;

    RETURN slots_created;
END;
$$;
