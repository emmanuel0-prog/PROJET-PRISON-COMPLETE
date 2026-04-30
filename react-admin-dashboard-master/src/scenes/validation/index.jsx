import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Stack, Button, TextField, 
  Autocomplete, Chip, IconButton, Divider, useTheme, 
  Dialog, DialogTitle, DialogContent, DialogActions, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  CircularProgress, Avatar, alpha, Tooltip, Grid
} from "@mui/material";
import { 
  Check, Search, Warning, LocalHospital, Gavel, 
  VerifiedUser, Policy, EventBusy, PersonSearch,
  AccountBalance, FileUpload, Visibility, History,
  Description, CloudUpload, DeleteForever
} from "@mui/icons-material";
import { motion } from "framer-motion";
import api from "../../api";

// Assets
import sceauRdc from "../../assets/gouvernement rdc.png";
import drapeauRdc from "../../assets/rdc.png";

const RDC_BLUE = "#007FFF";
const RDC_YELLOW = "#F7D618";
const RDC_RED = "#CE1126";

const GestionDeces = ({ userRole = 'DIRECTEUR' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const [decesList, setDecesList] = useState([]);
  const [detenus, setDetenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDeclare, setOpenDeclare] = useState(false);
  const [viewDetails, setViewDetails] = useState(null);
  
  // Formulaire
  const [selectedDetenu, setSelectedDetenu] = useState(null);
  const [cause, setCause] = useState("");
  const [dateDeces, setDateDeces] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDeces, resDetenus] = await Promise.all([
        api.get("/deces/"),
        api.get("/detenus/")
      ]);
      setDecesList(resDeces.data);
      setDetenus(resDetenus.data);
    } catch (err) {
      console.error("Erreur de chargement : ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/deces/${id}/${action}/`);
      fetchData();
      if(viewDetails) setViewDetails(null);
    } catch (err) {
      alert("Erreur lors de la validation administrative.");
    }
  };

  const handleDeclare = async () => {
    if (!selectedDetenu) return;
    try {
        const formData = new FormData();
        formData.append('detenu', selectedDetenu.id);
        formData.append('cause', cause);
        formData.append('date_deces', dateDeces);
        
        await api.post("/deces/", formData);
        setOpenDeclare(false);
        fetchData();
    } catch (err) {
        alert("Erreur lors de l'enregistrement.");
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 }, 
      minHeight: "100vh",
      bgcolor: isDark ? "#0a1929" : "#f4f7f9",
      backgroundImage: isDark 
        ? `radial-gradient(circle at 2px 2px, ${alpha(RDC_BLUE, 0.15)} 1px, transparent 0)` 
        : `radial-gradient(circle at 2px 2px, ${alpha(RDC_BLUE, 0.05)} 1px, transparent 0)`,
      backgroundSize: "40px 40px"
    }}>

      {/* BANNIÈRE GOUVERNEMENTALE */}
      <Paper elevation={0} sx={{ 
        p: 3, mb: 4, borderRadius: "24px", 
        background: isDark ? alpha("#132f4c", 0.8) : "#fff",
        backdropFilter: "blur(10px)",
        border: `1px solid ${alpha(RDC_BLUE, 0.2)}`,
        display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2
      }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar 
            src={sceauRdc} 
            sx={{ width: 80, height: 80, border: `2px solid ${RDC_YELLOW}`, p: 0.5, bgcolor: "#fff" }} 
          />
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#fff" : RDC_BLUE, letterSpacing: -1 }}>
              REGISTRE NATIONAL DES DÉCÈS
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
                <Policy sx={{ fontSize: 18, color: RDC_RED }} />
                <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.7, textTransform: "uppercase" }}>
                    Ministère de la Justice • Administration Pénitentiaire
                </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
           {userRole === 'MEDECIN' && (
              <Button 
                variant="contained" 
                onClick={() => setOpenDeclare(true)} 
                startIcon={<LocalHospital />}
                sx={{ bgcolor: RDC_RED, borderRadius: "12px", px: 4, fontWeight: 800, "&:hover": { bgcolor: "#a00d1d" } }}
              >
                Déclarer un Décès
              </Button>
           )}
           <Avatar src={drapeauRdc} sx={{ width: 50, height: 50, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }} />
        </Stack>
      </Paper>

      {/* TABLEAU DE BORD CENTRAL */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <TableContainer component={Paper} sx={{ 
          borderRadius: "24px", 
          overflow: "hidden", 
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? "#132f4c" : alpha(RDC_BLUE, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: RDC_BLUE }}>DÉTENU / MATRICULE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>CAUSE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUT</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress color="primary" /></TableCell></TableRow>
              ) : decesList.map((row) => (
                <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha(RDC_BLUE, 0.1), color: RDC_BLUE, fontWeight: 800 }}>
                        {row.detenu_name ? row.detenu_name[0] : "?"}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={800}>{row.detenu_name}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: "monospace", bgcolor: alpha(RDC_YELLOW, 0.2), px: 0.5, borderRadius: "4px" }}>
                            {row.detenu_matricule}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{row.cause}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                        {new Date(row.date_deces).toLocaleDateString('fr-FR')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={row.statut} 
                        size="small"
                        sx={{ 
                            fontWeight: 900, 
                            borderRadius: "6px",
                            bgcolor: row.statut === 'VALIDE' ? alpha("#4caf50", 0.1) : alpha(RDC_YELLOW, 0.1),
                            color: row.statut === 'VALIDE' ? "#4caf50" : "#ff9800",
                        }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Voir la fiche complète">
                            <IconButton onClick={() => setViewDetails(row)} size="small" sx={{ color: RDC_BLUE }}>
                                <Visibility />
                            </IconButton>
                        </Tooltip>
                        {userRole === 'DIRECTEUR' && row.statut === 'EN_ATTENTE' && (
                            <IconButton onClick={() => handleAction(row.id, 'valider')} size="small" sx={{ color: "#4caf50" }}>
                                <VerifiedUser />
                            </IconButton>
                        )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>

      {/* MODAL : FICHE DE DÉCÈS (DÉTAILS & MODIFICATION) */}
      <Dialog open={Boolean(viewDetails)} onClose={() => setViewDetails(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ bgcolor: RDC_BLUE, color: "#fff", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <History />
                <Typography variant="h6" fontWeight={800}>DÉCÈS - {viewDetails?.detenu_matricule} - {viewDetails?.detenu_name}</Typography>
            </Stack>
            <Chip label={viewDetails?.statut} sx={{ bgcolor: "#fff", fontWeight: 900 }} />
        </DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                    <Typography variant="overline" color="primary" fontWeight={800}>Informations Générales</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: "12px", bgcolor: alpha(RDC_BLUE, 0.02) }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Détenu Concerné</Typography>
                                <Typography fontWeight={700}>{viewDetails?.detenu_name}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Date et Heure du constat</Typography>
                                <Typography fontWeight={700}>{viewDetails?.date_deces ? new Date(viewDetails.date_deces).toLocaleString('fr-FR') : "Aujourd'hui / Maintenant"}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Cause du décès</Typography>
                                <Typography sx={{ p: 1, bgcolor: "#fff", borderRadius: "4px", border: "1px solid #eee" }}>{viewDetails?.cause || "MALARIA ++"}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="overline" color="primary" fontWeight={800}>Traçabilité Administrative</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: "12px", bgcolor: alpha(RDC_YELLOW, 0.02) }}>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Déclaré par :</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>E</Avatar>
                                    <Typography variant="body2" fontWeight={600}>{viewDetails?.declare_par || "Emmanuel09 (Administrateur Système)"}</Typography>
                                </Stack>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Validé par :</Typography>
                                <Typography variant="body2" fontWeight={600} color={viewDetails?.valide_par ? "success.main" : "warning.main"}>
                                    {viewDetails?.valide_par || "En attente de validation direction"}
                                </Typography>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Certificat Médical :</Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                    <Description color="error" />
                                    <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {viewDetails?.certificat || "certificats_deces/RAPPORT_MED_MAT-2026-0001.pdf"}
                                    </Typography>
                                    <Button size="small" startIcon={<DeleteForever />} color="error">Effacer</Button>
                                </Stack>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setViewDetails(null)} variant="outlined">Fermer</Button>
            {userRole === 'DIRECTEUR' && viewDetails?.statut === 'EN_ATTENTE' && (
                <Button variant="contained" color="success" onClick={() => handleAction(viewDetails.id, 'valider')} startIcon={<Check />}>
                    Valider Officiellement
                </Button>
            )}
        </DialogActions>
      </Dialog>

      {/* MODAL : DÉCLARATION MÉDECIN */}
      <Dialog open={openDeclare} onClose={() => setOpenDeclare(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900, color: RDC_RED, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalHospital /> NOUVELLE DÉCLARATION MÉDICO-LÉGALE
        </DialogTitle>
        <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <Autocomplete
                    options={detenus}
                    getOptionLabel={(option) => `${option.nom} ${option.prenom} (${option.matricule})`}
                    onChange={(e, val) => setSelectedDetenu(val)}
                    renderInput={(params) => (
                        <TextField {...params} label="Sélectionner le détenu" fullWidth />
                    )}
                />
                <TextField 
                    type="date"
                    label="Date du décès"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={dateDeces}
                    onChange={(e) => setDateDeces(e.target.value)}
                />
                <TextField 
                    fullWidth multiline rows={3} 
                    label="Causes et circonstances (ex: Malaria ++)" 
                    onChange={(e) => setCause(e.target.value)} 
                />
                <Box sx={{ p: 2, border: "2px dashed #ccc", borderRadius: "12px", textAlign: 'center' }}>
                    <CloudUpload sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" display="block">Téléverser le Certificat Médical (PDF/JPG)</Typography>
                    <input type="file" style={{ marginTop: '10px' }} />
                </Box>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDeclare(false)}>Annuler</Button>
            <Button variant="contained" onClick={handleDeclare} sx={{ bgcolor: RDC_BLUE }}>
                Enregistrer au Registre
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionDeces;