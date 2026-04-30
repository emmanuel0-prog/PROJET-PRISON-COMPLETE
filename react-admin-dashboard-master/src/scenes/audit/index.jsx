import React, { useState, useEffect } from "react";
import { 
    Box, Typography, Chip, IconButton, useTheme, Paper, Grid, 
    Avatar, Tooltip, alpha, Dialog, DialogTitle, DialogContent, Divider 
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { 
    Policy, Security, ManageSearch, CompareArrows, 
    AddCircle, Edit, DeleteForever, FindInPage
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

import api from "../../api";
import { tokens } from "../../theme";

// Assets officiels
import sceauRdc from "../../assets/rdc.png";
import drapeauRdc from "../../assets/gouvernement rdc.png";

const TraceurAudit = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode) || {}; 
    const isDark = theme.palette.mode === "dark";
    
    // 🛡️ SÉCURITÉ ANTI-CRASH
    const safeColors = {
        blue: colors?.blueAccent?.[500] || "#007FFF",
        blueDark: colors?.blueAccent?.[700] || "#002868",
        red: colors?.redAccent?.[500] || "#CE1126",
        orange: colors?.orangeAccent?.[500] || "#FF9800",
        green: colors?.greenAccent?.[500] || "#4CAF50",
        primaryBg: colors?.primary?.[400] || (isDark ? "#141b2d" : "#f5f7fa"),
        gridBg: colors?.primary?.[400] || (isDark ? "#1F2A40" : "#ffffff"),
        text: colors?.grey?.[100] || (isDark ? "#ffffff" : "#141414"),
        muted: colors?.grey?.[400] || "#9e9e9e"
    };

    // States
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, suppressions: 0, modifications: 0 });
    
    // State pour le modal d'investigation
    const [selectedLog, setSelectedLog] = useState(null);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await api.get('/audit-logs/');
            setData(response.data);
            
            // Calcul des stats
            const suppr = response.data.filter(d => d.type_action === 'SUPPRESSION').length;
            const modif = response.data.filter(d => d.type_action === 'MODIFICATION').length;
            setStats({ total: response.data.length, suppressions: suppr, modifications: modif });
        } catch (error) {
            console.error("Erreur de chargement de l'audit:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLogs(); }, []);

    // Configuration visuelle des actions
    const getActionConfig = (action) => {
        const configs = {
            'CREATION': { color: safeColors.green, icon: <AddCircle fontSize="small" />, label: "CRÉATION" },
            'MODIFICATION': { color: safeColors.orange, icon: <Edit fontSize="small" />, label: "MODIFICATION" },
            'SUPPRESSION': { color: safeColors.red, icon: <DeleteForever fontSize="small" />, label: "SUPPRESSION" },
        };
        return configs[action] || { color: safeColors.blue, icon: <Policy fontSize="small" />, label: action };
    };

    const columns = [
        { field: "date_action_formattee", headerName: "HORODATAGE", width: 170, renderCell: (p) => (
            <Typography fontWeight="bold" sx={{ color: safeColors.text }}>{p.value}</Typography>
        )},
        { field: "agent_identifiant", headerName: "AGENT OPÉRATEUR", width: 180, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1}>
                <Security sx={{ color: safeColors.blue, fontSize: "16px" }} />
                <Typography fontWeight="900" sx={{ textTransform: "uppercase" }}>{p.value}</Typography>
            </Box>
        )},
        { field: "type_action", headerName: "TYPE D'OPÉRATION", width: 160, renderCell: (p) => {
            const config = getActionConfig(p.value);
            return (
                <Chip 
                    icon={config.icon} 
                    label={config.label} 
                    size="small"
                    sx={{ 
                        bgcolor: alpha(config.color, 0.15), color: config.color, 
                        fontWeight: "900", border: `1px solid ${config.color}`, borderRadius: "4px"
                    }} 
                />
            );
        }},
        { field: "table_concernee", headerName: "CIBLE (ENTITÉ)", width: 150, renderCell: (p) => (
            <Typography sx={{ fontWeight: "bold", color: safeColors.muted }}>{p.value}</Typography>
        )},
        { field: "object_id", headerName: "ID RÉFÉRENCE", flex: 1, renderCell: (p) => (
            <Typography variant="caption" sx={{ fontFamily: "monospace", color: safeColors.blueDark, bgcolor: alpha(safeColors.blue, 0.1), p: 0.5, borderRadius: "4px" }}>
                {p.value}
            </Typography>
        )},
        { field: "adresse_ip", headerName: "ADRESSE IP", width: 140, renderCell: (p) => (
            <Typography sx={{ fontFamily: "monospace", opacity: 0.8 }}>{p.value || "Interne"}</Typography>
        )},
        { field: "actions", headerName: "ANALYSE", width: 120, sortable: false, renderCell: (p) => (
            <Tooltip title="Inspecter les données (Diff)">
                <IconButton sx={{ color: safeColors.blue }} onClick={() => setSelectedLog(p.row)}>
                    <FindInPage />
                </IconButton>
            </Tooltip>
        )}
    ];

    return (
        <Box m="25px" component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            {/* 🚀 HEADER CYBER-GOUV */}
            <Paper elevation={0} sx={{ 
                p: 3, mb: 4, 
                background: isDark 
                    ? `linear-gradient(135deg, ${alpha(safeColors.primaryBg, 0.95)} 0%, ${alpha('#000000', 0.6)} 100%)`
                    : `linear-gradient(135deg, #ffffff 0%, ${alpha(safeColors.muted, 0.1)} 100%)`,
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(safeColors.red, 0.4)}`, // Bordure rouge pour marquer la zone haute sécurité
                borderLeft: `8px solid ${safeColors.red}`,
                borderRadius: "15px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                position: "relative", overflow: "hidden"
            }}>
                <ManageSearch sx={{ position: "absolute", left: "10%", bottom: "-30px", fontSize: "200px", opacity: 0.03 }} />

                <Box component="img" src={sceauRdc} sx={{ height: 80, filter: isDark ? "drop-shadow(0 0 10px rgba(255,255,255,0.2))" : "none" }} />
                
                <Box textAlign="center" zIndex={1}>
                    <Typography variant="h2" fontWeight="900" sx={{ letterSpacing: "3px", color: isDark ? "#fff" : safeColors.blueDark }}>
                        INSPECTION GÉNÉRALE D'ÉTAT
                    </Typography>
                    <Typography variant="h5" fontWeight="800" sx={{ mt: 1, color: safeColors.red, textTransform: "uppercase", letterSpacing: "1px" }}>
                        Registre Central d'Audit & Traçabilité
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: "700", fontFamily: "monospace", color: safeColors.muted }}>
                            NIVEAU D'ACCÈS : CONFIDENTIEL DÉFENSE
                        </Typography>
                    </Box>
                </Box>

                <Avatar src={drapeauRdc} sx={{ width: 80, height: 80, border: `3px solid ${safeColors.red}`, boxShadow: `0 0 15px ${alpha(safeColors.red, 0.5)}` }} />
            </Paper>

            {/* 📊 DASHBOARD STATS */}
            <Grid container spacing={3} mb={4}>
                {[
                    { label: "MOUVEMENTS TOTAUX", val: stats.total, icon: <Security />, col: safeColors.blue },
                    { label: "ALERTS DE SUPPRESSION", val: stats.suppressions, icon: <DeleteForever />, col: safeColors.red },
                    { label: "MODIFICATIONS DONNÉES", val: stats.modifications, icon: <Edit />, col: safeColors.orange }
                ].map((s, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <Paper sx={{ 
                            p: 2.5, borderRadius: "10px", bgcolor: alpha(s.col, 0.05), borderBottom: `4px solid ${s.col}`,
                            display: "flex", alignItems: "center", gap: 2
                        }}>
                            <Avatar sx={{ bgcolor: s.col, width: 55, height: 55 }}>{s.icon}</Avatar>
                            <Box>
                                <Typography variant="h3" fontWeight="900" sx={{ color: safeColors.text }}>{s.val}</Typography>
                                <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.7, color: safeColors.text, letterSpacing: "1px" }}>{s.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* 📑 TABLEAU LECTURE SEULE */}
            <Box height="60vh" sx={{
                "& .MuiDataGrid-root": { border: `1px solid ${alpha(safeColors.muted, 0.2)}`, borderRadius: "10px", overflow: "hidden" },
                "& .MuiDataGrid-cell": { borderBottom: `1px solid ${alpha(safeColors.muted, 0.1)}` },
                "& .MuiDataGrid-columnHeaders": { backgroundColor: safeColors.primaryBg, color: safeColors.text, textTransform: "uppercase", borderBottom: `2px solid ${safeColors.red}` },
                "& .MuiDataGrid-virtualScroller": { backgroundColor: safeColors.gridBg },
                "& .MuiDataGrid-footerContainer": { backgroundColor: safeColors.primaryBg, color: safeColors.text, borderTop: `1px solid ${alpha(safeColors.muted, 0.2)}` },
                "& .MuiDataGrid-toolbarContainer .MuiButton-text": { color: `${safeColors.blue} !important`, fontWeight: "bold" },
            }}>
                <DataGrid 
                    rows={data} 
                    columns={columns} 
                    components={{ Toolbar: GridToolbar }}
                    getRowId={(row) => row.id}
                    loading={loading}
                    disableSelectionOnClick
                    density="compact"
                />
            </Box>

            {/* 🔬 MODAL D'INVESTIGATION (DIFF VIEWER) */}
            <AnimatePresence>
                {selectedLog && (
                    <Dialog open={Boolean(selectedLog)} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth PaperProps={{
                        component: motion.div, initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 },
                        sx: { bgcolor: safeColors.gridBg, borderRadius: "15px", border: `1px solid ${safeColors.blue}` }
                    }}>
                        <DialogTitle sx={{ bgcolor: alpha(safeColors.blue, 0.1), display: "flex", alignItems: "center", gap: 2 }}>
                            <FindInPage sx={{ color: safeColors.blue }} />
                            <Typography variant="h4" fontWeight="900">RAPPORT D'INVESTIGATION DÉTAILLÉ</Typography>
                        </DialogTitle>
                        <DialogContent sx={{ mt: 2 }}>
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color={safeColors.muted}>AGENT / OPÉRATEUR</Typography>
                                    <Typography variant="h6" fontWeight="bold">{selectedLog.agent_identifiant}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color={safeColors.muted}>HORODATAGE EXACT</Typography>
                                    <Typography variant="h6" fontWeight="bold">{selectedLog.date_action_formattee}</Typography>
                                </Grid>
                            </Grid>
                            
                            <Divider sx={{ mb: 2 }} />

                            <Typography variant="h6" fontWeight="bold" mb={2} color={safeColors.blue}>COMPARATIF DES DONNÉES (JSON PAYLOAD)</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={5}>
                                    <Typography variant="subtitle2" color={safeColors.red} fontWeight="bold" mb={1}>ÉTAT ANTÉRIEUR</Typography>
                                    <Paper sx={{ p: 2, bgcolor: isDark ? "#0d1117" : "#f6f8fa", height: "250px", overflow: "auto", fontFamily: "monospace", fontSize: "12px", border: `1px solid ${safeColors.red}` }}>
                                        <pre>{selectedLog.etat_ancien ? JSON.stringify(selectedLog.etat_ancien, null, 2) : "Aucune donnée (Création)"}</pre>
                                    </Paper>
                                </Grid>
                                
                                <Grid item xs={12} md={2} display="flex" justifyContent="center" alignItems="center">
                                    <CompareArrows sx={{ fontSize: 40, color: safeColors.muted, opacity: 0.5 }} />
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <Typography variant="subtitle2" color={safeColors.green} fontWeight="bold" mb={1}>ÉTAT ACTUEL / NOUVEAU</Typography>
                                    <Paper sx={{ p: 2, bgcolor: isDark ? "#0d1117" : "#f6f8fa", height: "250px", overflow: "auto", fontFamily: "monospace", fontSize: "12px", border: `1px solid ${safeColors.green}` }}>
                                        <pre>{selectedLog.etat_actuel ? JSON.stringify(selectedLog.etat_actuel, null, 2) : "Aucune donnée (Suppression)"}</pre>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>
        </Box>
    );
};

export default TraceurAudit;