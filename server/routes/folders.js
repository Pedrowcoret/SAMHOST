import express from 'express';
import { supabase, supabaseAuthMiddleware } from '../supabaseClient.js';

const router = express.Router();

// GET /api/folders — lista pastas do usuário
router.get('/', supabaseAuthMiddleware, async (req, res) => {
  try {
    const id_user = req.user.id;
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('id_user', id_user)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pastas', details: err.message });
  }
});

// POST /api/folders — cria nova pasta
router.post('/', supabaseAuthMiddleware, async (req, res) => {
  try {
    const { nome } = req.body;
    const id_user = req.user.id;

    if (!nome) {
      return res.status(400).json({ error: 'Nome da pasta é obrigatório.' });
    }

    const { data, error } = await supabase
      .from('folders')
      .insert([{ nome, id_user }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar pasta', details: err.message });
  }
});

// DELETE /api/folders/:id — apaga pasta se for do usuário
router.delete('/:id', supabaseAuthMiddleware, async (req, res) => {
  try {
    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

    const { data, error } = await supabase
      .from('folders')
      .delete()
      .eq('id', idNum)
      .eq('id_user', req.user.id);

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Pasta não encontrada ou sem permissão' });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir pasta', details: err.message });
  }
});

export default router;
