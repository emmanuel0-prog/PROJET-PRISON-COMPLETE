import React, { useState, useEffect } from "react";
import { 
    Box, Typography, Chip, Tabs, Tab, Stack, 
    IconButton, useTheme, Paper, Grid, Avatar, Tooltip, 
    alpha 
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { 
    Delete, Restore, CheckCircle, Warning, 
    Visibility, Policy, DeleteForever,
    Assessment, Gavel, Shield
} from "@mui/icons-material";
import { motion } from "framer-motion";

import api from "../../api";
import { tokens } from "../../theme";

// Assets officiels
import sceauRdc from "../../assets/rdc.png";
import drapeauRdc from "../../assets/gouvernement rdc.png";

const DecesManagement = () => {
    const theme = useTheme();
    // On récupère les couleurs, et on sécurise avec un objet vide si tokens échoue
    const colors = tokens(theme.palette.mode) || {}; 
    const isDark = theme.palette.mode === "dark";
    
    // 🛡️ SÉCURITÉ ANTI-CRASH : Couleurs de secours si theme.js est incomplet
    const safeColors = {
        blue: colors?.blueAccent?.[500] || "#007FFF", // Bleu RDC
        blueDark: colors?.blueAccent?.[700] || "#002868",
        red: colors?.redAccent?.[500] || "#CE1126",   // Rouge RDC
        orange: colors?.orangeAccent?.[500] || "#FF9800",
        green: colors?.greenAccent?.[500] || "#4CAF50",
        primaryBg: colors?.primary?.[400] || (isDark ? "#141b2d" : "#f5f7fa"),
        gridBg: colors?.primary?.[400] || (isDark ? "#1F2A40" : "#ffffff"),
        text: colors?.grey?.[100] || (isDark ? "#ffffff" : "#141414"),
        muted: colors?.grey?.[400] || "#9e9e9e"
    };

    // States
    const [data, setData] = useState([]);
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, enAttente: 0, enquetes: 0 });

    const loadDeces = async () => {
        setLoading(true);
        try {
            const isTrash = tab === 1;
            const response = await api.get(`/deces/?trash=${isTrash}`);
            setData(response.data);
            
            if (!isTrash) {
                const pending = response.data.filter(d => d.statut === 'EN_ATTENTE').length;
                const investigating = response.data.filter(d => d.statut === 'ENQUETE').length;
                setStats({ total: response.data.length, enAttente: pending, enquetes: investigating });
            }
        } catch (error) {
            console.error("Erreur de chargement:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDeces(); }, [tab]);

    const handleAction = async (id, action) => {
        const actionLabels = {
            'valider': 'VALIDER OFFICIELLEMENT',
            'enquete': 'OUVRIR UNE ENQUÊTE',
            'mettre_en_corbeille': 'ARCHIVER',
            'restaurer': 'RESTAURER',
            'supprimer_definitivement': 'SUPPRIMER DÉFINITIVEMENT'
        };

        if (!window.confirm(`SÉCURITÉ D'ÉTAT - RDC\nAction : ${actionLabels[action]} ?`)) return;
        
        try {
            if (action === 'supprimer_definitivement') {
                await api.delete(`/deces/${id}/supprimer_definitivement/`);
            } else {
                await api.post(`/deces/${id}/${action}/`);
            }
            loadDeces();
        } catch (error) {
            alert("Accès refusé ou erreur serveur.");
        }
    };

    const columns = [
        { field: "matricule", headerName: "MATRICULE", width: 120, renderCell: (p) => (
            <Typography fontWeight="900" sx={{ color: safeColors.blue, letterSpacing: "1px" }}>{p.value}</Typography>
        )},
        { field: "detenu_nom", headerName: "IDENTITÉ DU DÉTENU", flex: 1, renderCell: (p) => (
            <Box>
                <Typography fontWeight="bold" sx={{ textTransform: "uppercase" }}>{p.row.detenu_nom} {p.row.detenu_prenom}</Typography>
                <Typography variant="caption" sx={{ color: safeColors.muted }}>ID: {p.row.id}</Typography>
            </Box>
        )},
        { field: "statut", headerName: "STATUT LÉGAL", width: 180, renderCell: (p) => {
            const config = {
                'VALIDE': { color: safeColors.green, icon: <CheckCircle />, label: "ACTÉ / VALIDÉ" },
                'EN_ATTENTE': { color: safeColors.orange, icon: <Warning />, label: "EN ATTENTE" },
                'ENQUETE': { color: safeColors.red, icon: <Policy />, label: "SOUS ENQUÊTE" }
            };
            const current = config[p.value] || config['EN_ATTENTE'];
            return (
                <Chip 
                    icon={current.icon} 
                    label={current.label} 
                    sx={{ 
                        bgcolor: alpha(current.color, 0.15), 
                        color: current.color, 
                        fontWeight: "900", 
                        border: `1px solid ${current.color}`,
                        borderRadius: "4px"
                    }} 
                />
            );
        }},
        { field: "actions", headerName: "COMMANDE", width: 220, sortable: false, renderCell: (params) => (
            <Stack direction="row" spacing={1}>
                {tab === 0 ? (
                    <>
                        <Tooltip title="Dossier Complet"><IconButton sx={{ color: safeColors.blue }}><Visibility /></IconButton></Tooltip>
                        {params.row.statut !== 'VALIDE' && (
                            <Tooltip title="Certification"><IconButton sx={{ color: safeColors.green }} onClick={() => handleAction(params.row.id, 'valider')}><CheckCircle /></IconButton></Tooltip>
                        )}
                        <Tooltip title="Enquête Judiciaire"><IconButton sx={{ color: safeColors.red }} onClick={() => handleAction(params.row.id, 'enquete')}><Gavel /></IconButton></Tooltip>
                        <Tooltip title="Archiver"><IconButton color="error" onClick={() => handleAction(params.row.id, 'mettre_en_corbeille')}><Delete /></IconButton></Tooltip>
                    </>
                ) : (
                    <>
                        <Tooltip title="Réintégrer"><IconButton color="info" onClick={() => handleAction(params.row.id, 'restaurer')}><Restore /></IconButton></Tooltip>
                        <Tooltip title="Destruction"><IconButton color="error" onClick={() => handleAction(params.row.id, 'supprimer_definitivement')}><DeleteForever /></IconButton></Tooltip>
                    </>
                )}
            </Stack>
        )}
    ];

    return (
        <Box m="25px" component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            
            {/* 🚀 HEADER HIGH-TECH GOUV */}
            <Paper elevation={0} sx={{ 
                p: 3, mb: 4, 
                background: isDark 
                    ? `linear-gradient(135deg, ${alpha(safeColors.primaryBg, 0.9)} 0%, ${alpha(safeColors.blueDark, 0.4)} 100%)`
                    : `linear-gradient(135deg, #ffffff 0%, ${alpha(safeColors.blue, 0.1)} 100%)`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(safeColors.blue, 0.3)}`,
                borderRadius: "20px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                position: "relative", overflow: "hidden"
            }}>
                <Shield sx={{ position: "absolute", right: "-20px", bottom: "-20px", fontSize: "150px", opacity: 0.05 }} />

                <Box component="img" src={sceauRdc} sx={{ height: 90, filter: isDark ? "drop-shadow(0 0 10px rgba(255,255,255,0.2))" : "none" }} />
                
                <Box textAlign="center">
                    <Typography variant="h2" fontWeight="900" sx={{ letterSpacing: "4px", color: isDark ? "#fff" : safeColors.blueDark }}>
                        RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                    </Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1, color: safeColors.blue, textTransform: "uppercase" }}>
                        Ministère de la Justice & Garde des Sceaux
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 1 }}>
                        <Box sx={{ width: 40, height: 2, bgcolor: safeColors.red }} />
                        <Typography variant="body1" sx={{ fontWeight: "500", fontStyle: "italic", opacity: 0.8, color: safeColors.text }}>
                            Système Centralisé de Monitoring Carcéral
                        </Typography>
                        <Box sx={{ width: 40, height: 2, bgcolor: safeColors.red }} />
                    </Box>
                </Box>

                {/* Drapeau en Ronde High-Tech */}
                <Box sx={{ position: "relative" }}>
                    <Box sx={{ 
                        position: "absolute", inset: -5, borderRadius: "50%", 
                        border: `2px solid ${safeColors.blue}`, 
                        animation: "spin 10s linear infinite", opacity: 0.5 
                    }} />
                    <Avatar 
                        src={drapeauRdc} 
                        sx={{ 
                            width: 90, height: 90, 
                            border: `4px solid ${isDark ? safeColors.primaryBg : "#fff"}`, 
                            boxShadow: `0 0 20px ${alpha(safeColors.blue, 0.5)}` 
                        }} 
                    />
                </Box>
            </Paper>

            {/* 📊 DASHBOARD STATS (CARDS) */}
            <Grid container spacing={3} mb={4}>
                {[
                    { label: "DÉCÈS RÉPERTORIÉS", val: stats.total, icon: <Assessment />, col: safeColors.blue },
                    { label: "ENQUÊTES OUVERTES", val: stats.enquetes, icon: <Policy />, col: safeColors.red },
                    { label: "ATTENTE VALIDATION", val: stats.enAttente, icon: <Warning />, col: safeColors.orange }
                ].map((s, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <Paper sx={{ 
                            p: 2, borderRadius: "15px", bgcolor: alpha(s.col, 0.05), borderLeft: `6px solid ${s.col}`,
                            display: "flex", alignItems: "center", gap: 2
                        }}>
                            <Avatar sx={{ bgcolor: s.col, width: 50, height: 50 }}>{s.icon}</Avatar>
                            <Box>
                                <Typography variant="h3" fontWeight="900" sx={{ color: safeColors.text }}>{s.val}</Typography>
                                <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.7, color: safeColors.text }}>{s.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* 📑 TABLEAU DE GESTION */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="secondary" indicatorColor="secondary">
                    <Tab icon={<Shield fontSize="small" />} iconPosition="start" label="REGISTRE ACTIF" sx={{ fontWeight: "900", color: safeColors.text }} />
                    <Tab icon={<Delete fontSize="small" />} iconPosition="start" label="ARCHIVES / POUBELLE" sx={{ fontWeight: "900", color: safeColors.text }} />
                </Tabs>
            </Box>

            <Box height="60vh" sx={{
                "& .MuiDataGrid-root": { border: "none", borderRadius: "15px", overflow: "hidden" },
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(safeColors.muted, 0.1)}` },
                "& .MuiDataGrid-columnHeaders": { backgroundColor: safeColors.blueDark, color: "#fff", textTransform: "uppercase" },
                "& .MuiDataGrid-virtualScroller": { backgroundColor: safeColors.gridBg },
                "& .MuiDataGrid-footerContainer": { backgroundColor: safeColors.blueDark, color: "#fff" },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${safeColors.blue} !important` },
                "& .MuiDataGrid-root .MuiDataGrid-cellContent": { color: safeColors.text }
            }}>
                <DataGrid 
                    rows={data} 
                    columns={columns} 
                    components={{ Toolbar: GridToolbar }}
                    getRowId={(row) => row.id}
                    loading={loading}
                    disableSelectionOnClick
                />
            </Box>
        </Box>
    );
};

export default DecesManagement;