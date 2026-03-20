-- Inserir produtos reais do dia a dia do brasileiro
INSERT INTO public.products (id, name, brand, category, ean) VALUES
(uuid_generate_v4(), 'Arroz Branco 5kg', 'Camil', 'Alimentos Básicos', '7896006711111'),
(uuid_generate_v4(), 'Arroz Branco 5kg', 'Tio João', 'Alimentos Básicos', '7896006722222'),
(uuid_generate_v4(), 'Feijão Carioca 1kg', 'Camil', 'Alimentos Básicos', '7896006733333'),
(uuid_generate_v4(), 'Feijão Carioca 1kg', 'Kicaldo', 'Alimentos Básicos', '7896006744444'),
(uuid_generate_v4(), 'Leite Integral 1L', 'Parmalat', 'Laticínios', '7896006755555'),
(uuid_generate_v4(), 'Leite Integral 1L', 'Italac', 'Laticínios', '7896006766666'),
(uuid_generate_v4(), 'Café Torrado e Moído 500g', 'Pilão', 'Bebidas', '7896006777777'),
(uuid_generate_v4(), 'Café Torrado e Moído 500g', 'Melitta', 'Bebidas', '7896006788888'),
(uuid_generate_v4(), 'Óleo de Soja 900ml', 'Liza', 'Alimentos Básicos', '7896006799999'),
(uuid_generate_v4(), 'Açúcar Refinado 1kg', 'União', 'Alimentos Básicos', '7896006700000'),
(uuid_generate_v4(), 'Macarrão Espaguete 500g', 'Barilla', 'Massas', '7896006711112'),
(uuid_generate_v4(), 'Molho de Tomate 340g', 'Pomarola', 'Enlatados', '7896006722223'),
(uuid_generate_v4(), 'Sabão em Pó 1kg', 'Omo', 'Limpeza', '7896006733334'),
(uuid_generate_v4(), 'Detergente Líquido 500ml', 'Ypê', 'Limpeza', '7896006744445'),
(uuid_generate_v4(), 'Papel Higiênico Folha Dupla 12 Rolos', 'Neve', 'Higiene', '7896006755556'),
(uuid_generate_v4(), 'Creme Dental 90g', 'Colgate', 'Higiene', '7896006766667'),
(uuid_generate_v4(), 'Refrigerante Cola 2L', 'Coca-Cola', 'Bebidas', '7896006777778'),
(uuid_generate_v4(), 'Cerveja Pilsen Lata 350ml', 'Brahma', 'Bebidas', '7896006788889'),
(uuid_generate_v4(), 'Manteiga com Sal 200g', 'Aviação', 'Laticínios', '7896006799990'),
(uuid_generate_v4(), 'Pão de Forma 500g', 'Pullman', 'Padaria', '7896006700001')
ON CONFLICT (ean) DO NOTHING;

-- Inserir preços reais (simulados para o momento atual) em diferentes mercados
-- Usamos o nome do produto como product_id para facilitar a compatibilidade com o app atual
INSERT INTO public.prices (product_id, price, market, city, user_id) VALUES
('Arroz Branco 5kg', 24.90, 'Carrefour', 'São Paulo', 'system'),
('Arroz Branco 5kg', 26.50, 'Pão de Açúcar', 'São Paulo', 'system'),
('Arroz Branco 5kg', 23.80, 'Assaí Atacadista', 'São Paulo', 'system'),

('Feijão Carioca 1kg', 8.90, 'Carrefour', 'São Paulo', 'system'),
('Feijão Carioca 1kg', 9.50, 'Pão de Açúcar', 'São Paulo', 'system'),
('Feijão Carioca 1kg', 7.90, 'Assaí Atacadista', 'São Paulo', 'system'),

('Leite Integral 1L', 4.99, 'Carrefour', 'São Paulo', 'system'),
('Leite Integral 1L', 5.49, 'Pão de Açúcar', 'São Paulo', 'system'),
('Leite Integral 1L', 4.59, 'Assaí Atacadista', 'São Paulo', 'system'),

('Café Torrado e Moído 500g', 18.90, 'Carrefour', 'São Paulo', 'system'),
('Café Torrado e Moído 500g', 21.90, 'Pão de Açúcar', 'São Paulo', 'system'),
('Café Torrado e Moído 500g', 17.50, 'Assaí Atacadista', 'São Paulo', 'system'),

('Óleo de Soja 900ml', 5.99, 'Carrefour', 'São Paulo', 'system'),
('Óleo de Soja 900ml', 6.49, 'Pão de Açúcar', 'São Paulo', 'system'),
('Óleo de Soja 900ml', 5.49, 'Assaí Atacadista', 'São Paulo', 'system'),

('Açúcar Refinado 1kg', 4.50, 'Carrefour', 'São Paulo', 'system'),
('Açúcar Refinado 1kg', 4.90, 'Pão de Açúcar', 'São Paulo', 'system'),
('Açúcar Refinado 1kg', 4.10, 'Assaí Atacadista', 'São Paulo', 'system'),

('Macarrão Espaguete 500g', 3.99, 'Carrefour', 'São Paulo', 'system'),
('Macarrão Espaguete 500g', 4.50, 'Pão de Açúcar', 'São Paulo', 'system'),
('Macarrão Espaguete 500g', 3.50, 'Assaí Atacadista', 'São Paulo', 'system'),

('Molho de Tomate 340g', 2.99, 'Carrefour', 'São Paulo', 'system'),
('Molho de Tomate 340g', 3.50, 'Pão de Açúcar', 'São Paulo', 'system'),
('Molho de Tomate 340g', 2.50, 'Assaí Atacadista', 'São Paulo', 'system'),

('Sabão em Pó 1kg', 14.90, 'Carrefour', 'São Paulo', 'system'),
('Sabão em Pó 1kg', 16.90, 'Pão de Açúcar', 'São Paulo', 'system'),
('Sabão em Pó 1kg', 13.50, 'Assaí Atacadista', 'São Paulo', 'system'),

('Detergente Líquido 500ml', 2.49, 'Carrefour', 'São Paulo', 'system'),
('Detergente Líquido 500ml', 2.99, 'Pão de Açúcar', 'São Paulo', 'system'),
('Detergente Líquido 500ml', 2.19, 'Assaí Atacadista', 'São Paulo', 'system'),

('Papel Higiênico Folha Dupla 12 Rolos', 19.90, 'Carrefour', 'São Paulo', 'system'),
('Papel Higiênico Folha Dupla 12 Rolos', 22.90, 'Pão de Açúcar', 'São Paulo', 'system'),
('Papel Higiênico Folha Dupla 12 Rolos', 17.90, 'Assaí Atacadista', 'São Paulo', 'system'),

('Creme Dental 90g', 4.99, 'Carrefour', 'São Paulo', 'system'),
('Creme Dental 90g', 5.50, 'Pão de Açúcar', 'São Paulo', 'system'),
('Creme Dental 90g', 4.50, 'Assaí Atacadista', 'São Paulo', 'system'),

('Refrigerante Cola 2L', 8.99, 'Carrefour', 'São Paulo', 'system'),
('Refrigerante Cola 2L', 9.99, 'Pão de Açúcar', 'São Paulo', 'system'),
('Refrigerante Cola 2L', 8.49, 'Assaí Atacadista', 'São Paulo', 'system'),

('Cerveja Pilsen Lata 350ml', 3.49, 'Carrefour', 'São Paulo', 'system'),
('Cerveja Pilsen Lata 350ml', 3.99, 'Pão de Açúcar', 'São Paulo', 'system'),
('Cerveja Pilsen Lata 350ml', 3.19, 'Assaí Atacadista', 'São Paulo', 'system'),

('Manteiga com Sal 200g', 12.90, 'Carrefour', 'São Paulo', 'system'),
('Manteiga com Sal 200g', 14.90, 'Pão de Açúcar', 'São Paulo', 'system'),
('Manteiga com Sal 200g', 11.50, 'Assaí Atacadista', 'São Paulo', 'system'),

('Pão de Forma 500g', 7.99, 'Carrefour', 'São Paulo', 'system'),
('Pão de Forma 500g', 8.99, 'Pão de Açúcar', 'São Paulo', 'system'),
('Pão de Forma 500g', 6.99, 'Assaí Atacadista', 'São Paulo', 'system');
