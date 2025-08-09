-- Add RLS policies for INSERT, UPDATE and DELETE operations on aralogo_simples table

-- Allow authenticated users to insert new stones
CREATE POLICY "Authenticated users can insert stones" 
ON aralogo_simples 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM aralogo_auth 
    WHERE email = current_setting('app.current_user_email', true) 
    AND status = 'aprovado'
  )
);

-- Allow authenticated users to update stones
CREATE POLICY "Authenticated users can update stones" 
ON aralogo_simples 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM aralogo_auth 
    WHERE email = current_setting('app.current_user_email', true) 
    AND status = 'aprovado'
  )
);

-- Allow authenticated users to delete stones
CREATE POLICY "Authenticated users can delete stones" 
ON aralogo_simples 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM aralogo_auth 
    WHERE email = current_setting('app.current_user_email', true) 
    AND status = 'aprovado'
  )
);