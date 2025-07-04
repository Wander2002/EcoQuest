
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Progress } from "@/components/ui/progress.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import {
  Leaf,
  LogOut,
  Sword,
  Plus,
  AlertCircle,
  Badge as BadgeIcon,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { registerUser, loginUser, logoutUser } from "./services/authService";
import {
  saveUserData,
  createCharacter as createCharacterFirestore,
  getCharacterData,
  updateCharacterProgress,
  addCompletedQuest,
  updateCompletedAction, // Adicionado
  deleteCompletedAction, // Adicionado
  getUserCompletedQuests,
  cleanExpiredCompletedQuests,
  saveStreak,
  loadStreak,
  getGlobalRanking,
  createEvent,
  getAllEvents,
  confirmEvent,
  reportEvent,
  deleteEvent,
  getUserInventory,
} from "./services/firestoreService";
import { uploadFile, deleteFileByUrl } from "./services/firebaseStorageService"; // Adicionado
import "./App.css";

/* Leaflet */
import { MapContainer, TileLayer, Marker as LeafletMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* Google Maps */
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

/* App */
function App() {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("login");
  const [character, setCharacter] = useState(null);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [activeTab, setActiveTab] = useState("actions");
  const [userActions, setUserActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Events state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  // Event modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // Streak
  const [streakData, setStreakData] = useState({ streak: 0, lastActionDate: null, bestStreak: 0 });

  // user coordinates (for distance)
  const [userCoords, setUserCoords] = useState(null);

  // report/confirm loading state to disable buttons while requesting
  const [actionLoadingMap, setActionLoadingMap] = useState({}); // { [eventId]: { confirming: bool, reporting: bool } }

  const villains = [
    { id: 1, name: "Carbozento", description: "Restos de carbono e microplásticos.", baseHp: 100, baseAttack: 15, baseDefense: 5, emoji: "💀" },
    { id: 2, name: "Plastikraken", description: "Monstro de plástico que devora oceanos.", baseHp: 120, baseAttack: 12, baseDefense: 8, emoji: "👾" },
    { id: 3, name: "Desmatador Feroz", description: "Derruba florestas sem piedade.", baseHp: 150, baseAttack: 20, baseDefense: 10, emoji: "🪓" },
    { id: 4, name: "Aguazila", description: "Contamina rios com tentáculos tóxicos.", baseHp: 130, baseAttack: 18, baseDefense: 7, emoji: "🦑" },
    { id: 5, name: "Fedorácido", description: "Polui rios com dejetos químicos.", baseHp: 110, baseAttack: 16, baseDefense: 6, emoji: "☣️" },
    { id: 6, name: "Consumínion", description: "Incentiva compra excessiva e desperdício.", baseHp: 140, baseAttack: 14, baseDefense: 9, emoji: "👹" },
  ];

  /* Google Maps loader (Vite only) - usar import.meta.env */
  const googleApiKey = (import.meta && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) || "";

  const { isLoaded: googleMapsLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleApiKey || undefined,
  });

  /* --- Helpers: Static Map + Distância (Haversine) --- */
  function getStaticMapUrl({ lat, lng, width = 300, height = 200, apiKey }) {
    const w = Math.min(width, 640);
    const h = Math.min(height, 640);
    const base = "https://maps.googleapis.com/maps/api/staticmap";
    const params = new URLSearchParams({
      center: `${lat},${lng}`,
      zoom: "15",
      size: `${w}x${h}`,
      markers: `color:0x2E7D32|${lat},${lng}`,
      scale: "2",
      key: apiKey,
    });
    return `${base}?${params.toString()}`;
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    if ([lat1, lon1, lat2, lon2].some(v => v === null || v === undefined)) return "—";
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371e3; // metros
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
    const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    if (d < 1000) return `${Math.round(d)} m`;
    return `${(d / 1000).toFixed(1)} km`;
  }

  /* Thumbnail component (static map) */
  function EventThumbnail({ location, width = 160, height = 100 }) {
    const apiKey = googleApiKey || "";
    if (!apiKey) {
      return (
        <div className="w-[160px] h-[100px] rounded-md bg-gray-200 flex items-center justify-center text-sm text-gray-600 flex-shrink-0">
          Sem preview
        </div>
      );
    }

    const url = getStaticMapUrl({ lat: location.lat, lng: location.lng, width, height, apiKey });
    return (
      <img src={url} alt="Mapa do evento" className="w-[160px] h-[100px] object-cover rounded-md shadow-sm flex-shrink-0" />
    );
  }

	  const showNotification = (message, type = "success") => {
	    setNotification({ message, type });
	    setTimeout(() => setNotification(null), 3500);
	  };

	  /* Delete Action */
	  const handleDeleteAction = async (action) => {
	    if (!user) {
	      showNotification("Erro: usuário não autenticado.", "error");
	      return;
	    }

	    if (window.confirm(`Tem certeza que deseja excluir a ação "${action.title}"?`)) {
	      try {
		        // 1. Excluir imagem de prova, se houver (Removido, pois a funcionalidade de imagem foi removida)
		        // if (action.proof && action.proof.type === 'image' && action.proof.value) {
		        //   await deleteFileByUrl(action.proof.value);
		        // }

		        // 2. Excluir registro do Firestore
	        const result = await deleteCompletedAction(user.uid, action.id);
	        if (!result.success) throw new Error(result.error);

	        // 3. Atualizar lista de ações na UI
	        await updateQuests(user.uid);

	        showNotification(`Ação "${action.title}" excluída com sucesso.`);
	      } catch (error) {
	        console.error("Erro ao excluir ação:", error);
	        showNotification("Erro ao excluir ação. Tente novamente.", "error");
	      }
	    }
	  };

  /* Actions / Quests */
  const updateQuests = async (currentUserId) => {
    try {
      const questsResult = await getUserCompletedQuests(currentUserId);
      const userActionsFromDb = questsResult.success ? questsResult.data : [];
      const normalizedActions = userActionsFromDb.map((q) => ({
        id: q.id || q._id || Date.now().toString(),
        title: q.title || q.name || "Ação registrada",
        description: q.description || q.detail || "",
        category: q.category || q.type || "outros",
        proof: q.proof || null,
        xpReward: q.xpReward || q.xp || 0,
        date: q.date || q.createdAt || Date.now(),
        location: q.location || null,
      }));
      setUserActions(normalizedActions);
    } catch (err) {
      console.error("Erro updateQuests:", err);
    }
  };

  const calculateActionReward = (impactCategory) => {
    switch (impactCategory) {
      case "reciclagem":
        return { xp: 50 };
      case "energia":
        return { xp: 70 };
      case "transporte":
        return { xp: 90 };
      case "reflorestamento":
        return { xp: 120 };
      default:
        return { xp: 40 };
    }
  };

  /* Streak logic */
  const updateStreakForUser = async (userId) => {
    try {
      const loaded = await loadStreak(userId);
      const now = Date.now();
      let streak = 1;
      let bestStreak = (loaded && loaded.bestStreak) ? loaded.bestStreak : 0;

      if (loaded && loaded.lastActionDate) {
        const last = loaded.lastActionDate.toMillis ? loaded.lastActionDate.toMillis() : new Date(loaded.lastActionDate).getTime();
        const diff = now - last;
        if (diff <= 24 * 60 * 60 * 1000) {
          streak = loaded.streak || 1;
        } else if (diff <= 48 * 60 * 60 * 1000) {
          streak = (loaded.streak || 0) + 1;
        } else {
          streak = 1;
        }
      }

      bestStreak = Math.max(bestStreak, streak);
      const toSave = { streak, lastActionDate: new Date(now), bestStreak };
      await saveStreak(userId, toSave);
      setStreakData(toSave);
    } catch (err) {
      console.error("Erro ao atualizar streak:", err);
    }
  };

  /* Register Action Modal */
  const RegisterActionModal = ({ onClose, initialAction = null }) => {
    const [title, setTitle] = useState(initialAction ? initialAction.title : "");
    const [description, setDescription] = useState(initialAction ? initialAction.description : "");
    const [category, setCategory] = useState(initialAction ? initialAction.category : "reciclagem");
    const [proofValue, setProofValue] = useState(initialAction && initialAction.proof ? initialAction.proof.value : ""); // Mantido para texto/link
    const [isUploading, setIsUploading] = useState(false); // Estado de loading para upload

    const handleRegister = async () => {
      if (!title.trim() || !description.trim()) {
        showNotification("Por favor, preencha todos os campos.", "error");
        return;
      }
      if (!user || !character) {
        showNotification("Erro: usuário ou personagem não encontrado.", "error");
        return;
      }

      setIsUploading(true);
      
      const reward = calculateActionReward(category);
      const actionData = {
        title,
        description,
        category,
        proof: proofValue ? { type: "text", value: proofValue } : null, // Simplificado para prova em texto/link
        xpReward: reward.xp,
        date: initialAction ? initialAction.date : Date.now(),
      };

      try {
        if (initialAction) {
          // Lógica de Edição
          await updateCompletedAction(user.uid, initialAction.id, actionData);
          showNotification(`Ação "${title}" atualizada com sucesso!`);
        } else {
          // Lógica de Registro (Adição)
          const result = await addCompletedQuest(user.uid, actionData);
          if (!result.success) throw new Error(result.error);

          let newXp = (character.xp || 0) + reward.xp;
          let newLevel = character.level || 1;
          let newMaxXp = character.maxXp || 100;
          let newHp = character.hp || 100;
          let newMaxHp = character.maxHp || 100;

          while (newXp >= newMaxXp) {
            newXp -= newMaxXp;
            newLevel += 1;
            newMaxXp = Math.floor(newMaxXp * 1.5);
            newMaxHp += 20;
            newHp = newMaxHp;
          }

          const updatedCharacter = {
            ...character,
            xp: newXp,
            level: newLevel,
            maxXp: newMaxXp,
            hp: newHp,
            maxHp: newMaxHp,
          };

          setCharacter(updatedCharacter);
          await updateCharacterProgress(user.uid, newXp, newLevel, newMaxXp, newHp, newMaxHp);
          await updateStreakForUser(user.uid);
          showNotification(`Ação registrada! +${reward.xp} XP ganhos.`);
        }

        await updateQuests(user.uid);
        onClose && onClose();
        setTitle("");
        setDescription("");
        setCategory("reciclagem");
        setProofValue("");
      } catch (error) {
        console.error("Erro ao registrar/atualizar ação:", error);
        showNotification("Erro ao registrar/atualizar ação. Tente novamente.", "error");
      } finally {
        setIsUploading(false);
      }
    };

    function ActionMapPicker({ initialPosition = [-23.55052, -46.633308], onSelect, onClose }) {
      const [pos, setPos] = useState(initialPosition);
      function ClickHandler() {
        useMapEvents({
          click(e) {
            setPos([e.latlng.lat, e.latlng.lng]);
          },
        });
        return null;
      }
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-3xl h-[70vh] flex flex-col overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <CardTitle>Escolha o local no mapa</CardTitle>
                <div>
                  <Button variant="outline" onClick={onClose}>
                    Fechar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <MapContainer center={pos} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <ClickHandler />
                <LeafletMarker position={pos} />
              </MapContainer>
            </CardContent>
            <div className="p-4 flex gap-2 justify-end">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Coordenadas: {pos[0].toFixed(5)}, {pos[1].toFixed(5)}</p>
              </div>
              <Button onClick={() => { onSelect({ lat: pos[0], lng: pos[1] }); onClose(); }}>Confirmar</Button>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-[420px] shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center">Registrar Nova Ação Sustentável</CardTitle>
            <CardDescription className="text-center">Descreva sua ação e (opcional) marque a localização</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Plantei uma árvore" />
              <Label>Descrição</Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 border rounded-md h-20 resize-y" />
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cat">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reciclagem">Reciclagem</SelectItem>
                  <SelectItem value="energia">Economia de Energia</SelectItem>
                  <SelectItem value="transporte">Transporte Sustentável</SelectItem>
                  <SelectItem value="reflorestamento">Reflorestamento</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>



              <div className="grid gap-2">
                <Label>Detalhes da Prova (Texto ou Link)</Label>
                <textarea value={proofValue} onChange={(e) => setProofValue(e.target.value)} className="p-2 border rounded-md h-16 resize-y" placeholder="Descreva a prova ou cole um link" />
              </div>

              <div className="flex gap-2">
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleRegister} disabled={isUploading}>
                  {isUploading ? "Enviando..." : initialAction ? "Salvar Edição" : "Registrar Ação"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => onClose && onClose()} disabled={isUploading}>Cancelar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  };

  /* GoogleMapPicker */
  function GoogleMapPicker({ initialPosition = { lat: -23.55052, lng: -46.633308 }, onSelect, onClose }) {
    const [pos, setPos] = useState(initialPosition);
    if (!googleMapsLoaded) return <div className="p-4">Carregando mapa...</div>;

    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <Card className="w-full max-w-3xl overflow-hidden">
          <CardHeader>
            <CardTitle>Selecione o Local do Evento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ width: "100%", height: "60vh" }}>
              <GoogleMap
                zoom={13}
                center={pos}
                onClick={(e) => setPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                mapContainerStyle={{ width: "100%", height: "100%" }}
              >
                <Marker position={pos} />
              </GoogleMap>
            </div>

            <div className="p-4 flex justify-between items-center">
              <p>Selecionado: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</p>
              <div className="flex gap-2">
                <Button onClick={() => { onSelect(pos); onClose(); }}>Confirmar Local</Button>
                <Button variant="outline" onClick={onClose}>Fechar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* CreateEventModal (corrigido: usa coordsLocal local e NÃO limpa nome/descrição ao escolher local) */
  const CreateEventModal = ({ onClose }) => {
    const [name, setName] = useState("");
       const [description, setDescription] = useState("");
    const [coordsLocal, setCoordsLocal] = useState(null); // local only
    const [mapOpen, setMapOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!name.trim() || !description.trim() || !coordsLocal) {
        showNotification("Preencha nome, descrição e selecione localização", "error");
        return;
      }
      setSubmitting(true);
      try {
        await createEvent(name, description, coordsLocal, user?.uid);
        // limpar somente após sucesso
        setName("");
        setDescription("");
        setCoordsLocal(null);
        onClose && onClose();
        await loadEvents();
        showNotification("Evento criado com sucesso!");
      } catch (err) {
        console.error("Erro criar evento:", err);
        showNotification("Erro ao criar evento", "error");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-[520px] shadow-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center">Cadastrar Novo Evento Sustentável</CardTitle>
            <CardDescription className="text-center">Informe nome, descrição e escolha a localização no mapa</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nome do Evento</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mutirão de limpeza" />
            </div>

            <div className="grid gap-2">
              <Label>Descrição</Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 border rounded-md h-28 resize-y break-words" />
            </div>

            <div>
              <Label>Localização</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button onClick={() => setMapOpen(true)}>Selecionar Local</Button>
                <div className="flex-1 text-sm text-gray-600 min-w-0 overflow-hidden">
                  {coordsLocal ? <span className="block truncate">Selecionado: {coordsLocal.lat.toFixed(5)}, {coordsLocal.lng.toFixed(5)}</span> : <span className="text-gray-400">Nenhuma localização</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <Button className="bg-primary hover:bg-primary/90" onClick={handleSubmit} disabled={submitting}>{submitting ? "Enviando..." : "Criar Evento"}</Button>
              <Button variant="outline" onClick={() => { setCoordsLocal(null); onClose && onClose(); }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>

        {mapOpen && <GoogleMapPicker initialPosition={{ lat: -23.55052, lng: -46.633308 }} onSelect={(coords) => { setCoordsLocal(coords); setMapOpen(false); }} onClose={() => setMapOpen(false)} />}
      </div>
    );
  };

  /* Event details modal */
  const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    const handleVoteExists = async () => {
      setActionLoadingMap(prev => ({ ...prev, [event.id]: { ...(prev[event.id] || {}), confirming: true } }));
      try {
        await confirmEvent(event.id);
        await loadEvents();
        showNotification("Obrigado por confirmar!");
      } catch (err) {
        console.error("Erro ao confirmar evento:", err);
        showNotification("Erro ao confirmar evento", "error");
      } finally {
        setActionLoadingMap(prev => ({ ...prev, [event.id]: { ...(prev[event.id] || {}), confirming: false } }));
      }
    };

    const handleVoteNotExists = async () => {
      const ok = window.confirm("Tem certeza que deseja reportar este evento como inexistente?");
      if (!ok) return;

      setActionLoadingMap(prev => ({ ...prev, [event.id]: { ...(prev[event.id] || {}), reporting: true } }));
      try {
        const res = await reportEvent(event.id);
        await loadEvents();
        if (res && res.deleted) {
          showNotification("Evento removido por não existir mais.");
          onClose && onClose();
          return;
        }
        showNotification("Obrigado por reportar. Nossa comunidade irá avaliar.");
      } catch (err) {
        console.error("Erro ao reportar evento:", err);
        showNotification("Erro ao reportar evento", "error");
      } finally {
        setActionLoadingMap(prev => ({ ...prev, [event.id]: { ...(prev[event.id] || {}), reporting: false } }));
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg shadow-xl overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="min-w-0">{event.name}</CardTitle>
              <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
            <CardDescription className="text-sm text-gray-700 mt-1 break-words whitespace-pre-wrap">
              {event.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loadError ? (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded mb-4">
                <strong>Mapa indisponível:</strong>
                <p className="text-sm mt-1">
                  O carregamento do Google Maps falhou ({loadError?.message || "erro"}). Verifique billing e as configurações da API Key.
                </p>
              </div>
            ) : (
              <div className="w-full h-[300px] rounded-lg overflow-hidden mb-4">
                <GoogleMap
                  zoom={15}
                  center={{ lat: event.location.lat, lng: event.location.lng }}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                >
                  <Marker position={{ lat: event.location.lat, lng: event.location.lng }} />
                </GoogleMap>
              </div>
            )}

            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">Este evento ainda existe?</p>

              <div className="flex gap-3">
                <Button
                  className="w-full bg-green-600"
                  onClick={handleVoteExists}
                  disabled={(actionLoadingMap[event.id] && actionLoadingMap[event.id].confirming) || false}
                >
                  {actionLoadingMap[event.id] && actionLoadingMap[event.id].confirming ? "Confirmando..." : "👍 Sim, ainda existe"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleVoteNotExists}
                  disabled={(actionLoadingMap[event.id] && actionLoadingMap[event.id].reporting) || false}
                >
                  {actionLoadingMap[event.id] && actionLoadingMap[event.id].reporting ? "Reportando..." : "👎 Não existe mais"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  /* Events loading and handlers */
  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await getAllEvents();
      setEvents(res || []);
    } catch (err) {
      console.error("Erro ao carregar eventos:", err);
      showNotification("Erro ao carregar eventos", "error");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleConfirmEvent = async (eventId) => {
    setActionLoadingMap(prev => ({ ...prev, [eventId]: { ...(prev[eventId] || {}), confirming: true } }));
    try {
      await confirmEvent(eventId);
      await loadEvents();
      showNotification("Obrigado! Evento confirmado.");
    } catch (err) {
      console.error(err);
      showNotification("Erro ao confirmar evento.", "error");
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [eventId]: { ...(prev[eventId] || {}), confirming: false } }));
    }
  };

  const handleReportEvent = async (eventId) => {
    const ok = window.confirm("Tem certeza que deseja reportar este evento como inexistente?");
    if (!ok) return;

    setActionLoadingMap(prev => ({ ...prev, [eventId]: { ...(prev[eventId] || {}), reporting: true } }));
    try {
      const res = await reportEvent(eventId);
      await loadEvents();
      if (res && res.deleted) {
        showNotification("Evento removido por não existir mais.");
      } else {
        showNotification("Report enviado. Obrigado!");
      }
    } catch (err) {
      console.error(err);
      showNotification("Erro ao reportar evento.", "error");
    } finally {
      setActionLoadingMap(prev => ({ ...prev, [eventId]: { ...(prev[eventId] || {}), reporting: false } }));
    }
  };

  /* Lifecycle */
  useEffect(() => {
    if (loading) return;
    if (user) {
      (async () => {
        try {
          const s = await loadStreak(user.uid);
          if (s) setStreakData({ streak: s.streak || 0, lastActionDate: s.lastActionDate || null, bestStreak: s.bestStreak || 0 });
        } catch (err) {
          console.warn("Erro carregar streak:", err);
        }
      })();
      loadUserData();
      loadEvents();
    } else {
      setCurrentScreen("login");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  useEffect(() => {
    if (!user) {
      setUserCoords(null);
      return;
    }
    if (!("geolocation" in navigator)) {
      console.warn("Geolocalização não suportada pelo navegador.");
      return;
    }

    const geoSuccess = (pos) => {
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    };
    const geoError = (err) => {
      console.warn("Erro ao obter geolocalização:", err);
      setUserCoords(null);
    };

    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, { maximumAge: 60 * 1000, timeout: 8000 });
  }, [user]);

  useEffect(() => {
    let intervalId;
    if (user && character) {
      intervalId = setInterval(async () => {
        await cleanExpiredCompletedQuests(user.uid);
        updateQuests(user.uid);
      }, 60 * 1000);
    }
    return () => clearInterval(intervalId);
  }, [user, character]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const characterResult = await getCharacterData(user.uid);
      if (characterResult.success) {
        setCharacter(characterResult.data);
        await updateQuests(user.uid);
        setCurrentScreen("game");
      } else {
        setCurrentScreen("character-creation");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showNotification("Erro ao carregar dados do jogo. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* Auth handlers */
  const handleLogin = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      if (result.success) {
        await saveUserData(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName || email.split("@")[0],
          lastLogin: new Date(),
        });
      } else {
        showNotification(`Erro ao fazer login: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      showNotification(`Erro ao fazer login: ${error.message}`, "error");
    }
  };

  const handleRegister = async (name, email, password) => {
    try {
      const result = await registerUser(email, password, name);
      if (result.success) {
        await saveUserData(result.user.uid, {
          email: result.user.email,
          displayName: name,
          createdAt: new Date(),
          lastLogin: new Date(),
        });
        setCurrentScreen("character-creation");
        showNotification("Cadastro realizado com sucesso! Agora crie seu Guardião.");
      } else {
        showNotification(`Erro ao registrar: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Erro ao registrar: ", error);
      showNotification(`Erro ao registrar: ${error.message}`, "error");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUserActions([]);
      setCharacter(null);
      setCurrentBattle(null);
      setCurrentScreen("login");
      showNotification("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showNotification(`Erro ao fazer logout: ${error.message}`, "error");
    }
  };

  const handleCreateCharacter = async (characterData) => {
    if (!user || !user.uid) {
      showNotification("Erro: Usuário não autenticado. Por favor, faça login novamente.", "error");
      return;
    }
    try {
      const newCharacter = {
        ...characterData,
        level: 1,
        xp: 0,
        maxXp: 100,
        hp: 100,
        maxHp: 100,
      };
      const result = await createCharacterFirestore(user.uid, newCharacter);
      if (result && result.success) {
        setCharacter(newCharacter);
        await updateQuests(user.uid);
        setCurrentScreen("game");
        showNotification(`Guardião ${newCharacter.name} criado com sucesso!`);
      } else {
        showNotification(`Erro ao criar personagem: ${result ? result.error : "Resposta indefinida"}`, "error");
      }
    } catch (error) {
      console.error("Erro ao criar personagem:", error);
      showNotification(`Erro ao criar personagem: ${error.message}`, "error");
    }
  };

  /* Combat - simplified */
  const startBattle = (villainId) => {
    const baseVillain = villains.find((v) => v.id === villainId);
    if (baseVillain && character) {
      const scaledHp = baseVillain.baseHp * (1 + (character.level - 1) * 0.1);
      const scaledAttack = baseVillain.baseAttack * (1 + (character.level - 1) * 0.05);
      const scaledDefense = baseVillain.baseDefense * (1 + (character.level - 1) * 0.03);

      setCurrentBattle({
        villain: {
          ...baseVillain,
          hp: Math.round(scaledHp),
          maxHp: Math.round(scaledHp),
          attack: Math.round(scaledAttack),
          defense: Math.round(scaledDefense),
          level: character.level,
        },
        playerHp: character.hp,
        turn: "player",
        log: [`Você encontrou ${baseVillain.name} (Nível ${character.level})! O combate começou!`],
      });
    }
  };

  const performAttack = () => {
    if (!currentBattle || currentBattle.turn !== "player") return;
    const { villain } = currentBattle;
    const damage = Math.floor(Math.random() * 21) + 10; // 10 - 30
    const message = `Você atacou e causou ${damage} de dano!`;
    const newVillainHp = Math.max(0, villain.hp - damage);

    setCurrentBattle((prev) => ({
      ...prev,
      villain: { ...prev.villain, hp: newVillainHp },
      turn: "villain",
      log: [...prev.log, message],
    }));

    if (newVillainHp <= 0) {
      setTimeout(async () => {
        const reward = 100 + (villain.maxHp / 2);
        let newXp = character.xp + reward;
        let newLevel = character.level;
        let newMaxXp = character.maxXp;
        let newHp = character.hp;
        let newMaxHp = character.maxHp;

        while (newXp >= newMaxXp) {
          newXp -= newMaxXp;
          newLevel += 1;
          newMaxXp = Math.floor(newMaxXp * 1.5);
          newMaxHp += 20;
          newHp = newMaxHp;
        }

        const updatedCharacter = { ...character, xp: newXp, level: newLevel, maxXp: newMaxXp, hp: newHp, maxHp: newMaxHp };
        setCharacter(updatedCharacter);
        await updateCharacterProgress(user.uid, newXp, newLevel, newMaxXp, newHp, newMaxHp);

        showNotification(`Vitória! Você derrotou ${villain.name}! Ganhou ${reward} XP!`);
        setCurrentBattle((prev) => ({ ...prev, log: [...prev.log, `${villain.name} foi derrotado! Você ganhou ${reward} XP!`] }));
        setTimeout(() => setCurrentBattle(null), 2000);
      }, 1000);
      return;
    }

    setTimeout(() => {
      const villainDamage = villain.attack + Math.floor(Math.random() * 5);
      const newPlayerHp = Math.max(0, currentBattle.playerHp - villainDamage);

      setCurrentBattle((prev) => ({
        ...prev,
        playerHp: newPlayerHp,
        turn: "player",
        log: [...prev.log, `${villain.name} atacou! Você recebeu ${villainDamage} de dano!`],
      }));

      if (newPlayerHp <= 0) {
        setTimeout(() => {
          setCurrentBattle((prev) => ({ ...prev, log: [...prev.log, "Você foi derrotado! Tente novamente após completar mais missões."] }));
          setTimeout(() => {
            setCurrentBattle(null);
            showNotification("Você foi derrotado! Complete mais missões para fortalecer seu guardião.", "error");
          }, 2000);
        }, 1000);
        return;
      }

      setCurrentBattle((prev) => ({ ...prev, turn: "player" }));
    }, 1500);
  };

  /* Notification component */
  const NotificationComponent = () => {
    if (!notification) return null;
    const bgColor = notification.type === "error" ? "bg-red-500" : "bg-green-500";
    return (
      <div className={`fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-md`}>
        {notification.type === "error" ? <AlertCircle className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
        <div>
          <p className="font-bold">{notification.message}</p>
        </div>
      </div>
    );
  };

  /* Screens: Login, Register, CharacterCreation, Ranking, Achievements (complete) */
  const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
        <Card className="w-[350px] shadow-xl">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="EcoQuest Logo" className="h-24 w-24" />
            </div>
            <CardTitle className="text-center text-3xl font-bold">EcoQuest</CardTitle>
            <CardDescription className="text-center text-lg"></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seunome@exemplo.com" />
              </div>
              <div className="grid gap-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full h-11 mt-2 bg-primary hover:bg-primary/90" onClick={() => handleLogin(email, password)}>Entrar</Button>
              <Button variant="outline" className="w-full h-11" onClick={() => setCurrentScreen("register")}>Cadastrar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const RegisterScreen = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const handleRegisterClick = () => {
      if (password !== confirmPassword) {
        showNotification("As senhas não coincidem!", "error");
        return;
      }
      handleRegister(name, email, password);
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
        <Card className="w-[350px] shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Cadastre-se no EcoQuest</CardTitle>
            <CardDescription className="text-center">Crie sua conta de Guardião do Planeta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Label>Confirmar Senha</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Button className="w-full h-11 mt-2 bg-primary hover:bg-primary/90" onClick={handleRegisterClick}>Cadastrar</Button>
              <Button variant="outline" className="w-full h-11" onClick={() => setCurrentScreen("login")}>Já tenho uma conta</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const CharacterCreationScreen = () => {
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState("🌱");
    const handleCreateClick = () => {
      if (!name.trim()) {
        showNotification("Por favor, digite um nome para o seu Guardião.", "error");
        return;
      }
      handleCreateCharacter({ name, avatar });
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
        <Card className="w-[450px] shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Criação de Personagem</CardTitle>
            <CardDescription>Configure seu Guardião do Planeta</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Label>Nome do Guardião</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-2 justify-center">
              {["🌱", "🌿", "🌳", "🍃", "🌺", "🌻", "🌍", "♻️"].map((emoji, i) => (
                <Button key={i} variant={avatar === emoji ? "default" : "outline"} onClick={() => setAvatar(emoji)} className="text-2xl p-2 w-12 h-12 avatar-emoji">{emoji}</Button>
              ))}
            </div>
            <Button className="w-full h-11 mt-2 bg-primary hover:bg-primary/90" onClick={handleCreateClick}>Criar Guardião</Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const RankingScreen = () => {
    const [ranking, setRanking] = useState([]);
    const [loadingRank, setLoadingRank] = useState(true);
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const res = await getGlobalRanking(50);
          if (mounted) setRanking(res || []);
        } catch (err) {
          console.error("Erro carregar ranking:", err);
        } finally {
          if (mounted) setLoadingRank(false);
        }
      })();
      return () => (mounted = false);
    }, []);
    const top3 = ranking.slice(0, 3);
    const restOfRanking = ranking.slice(3);

    const getCardClass = (index) => {
      if (index === 0) return "bg-yellow-100 border-yellow-500 shadow-xl scale-[1.02]";
      if (index === 1) return "bg-gray-100 border-gray-400 shadow-lg";
      if (index === 2) return "bg-amber-100 border-amber-400 shadow-lg";
      return "bg-white border-gray-200";
    };

    const getMedal = (index) => {
      if (index === 0) return "🥇";
      if (index === 1) return "🥈";
      if (index === 2) return "🥉";
      return `${index + 1}.`;
    };

    const RankingItem = ({ user, index }) => (
      <Card key={user.uid || index} className={`p-4 transition-all duration-300 ${getCardClass(index)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`text-2xl font-bold w-8 text-center ${index < 3 ? 'text-gray-800' : 'text-gray-500'}`}>{getMedal(index)}</div>
            <div className="text-3xl">{user.avatar || "🌱"}</div>
            <div className="min-w-0">
              <div className="font-bold truncate">{user.displayName}</div>
              <div className="text-xs text-gray-500 truncate">{user.email || ''}</div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs uppercase tracking-wide">Nível {user.level || 1}</Badge>
            <div className="flex items-center text-sm font-semibold text-orange-700">
              <span className="text-base mr-1">🔥</span>
              <span>{user.streak || 0} dias</span>
            </div>
          </div>
        </div>
      </Card>
    );

    return (
      <div className="p-4">
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800 border-b pb-2">Ranking Global de Guardiões</h2>
        {loadingRank ? <p className="text-center text-gray-500">Carregando ranking...</p> : (
          <div className="grid gap-4">
            {/* Top 3 em destaque */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((u, i) => (
                <RankingItem key={u.uid || i} user={u} index={i} />
              ))}
            </div>

            {/* Demais colocados */}
            <div className="grid gap-2">
              {restOfRanking.map((u, i) => (
                <RankingItem key={u.uid || i + 3} user={u} index={i + 3} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const AchievementsScreen = () => {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Conquistas</h2>
        <div className="grid gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Streak atual</div>
                <div className="text-2xl font-bold">🔥 {streakData.streak || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Melhor streak</div>
                <div className="text-2xl font-bold">{streakData.bestStreak || 0}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div>
              <div className="text-sm text-gray-500">Ações registradas</div>
              <div className="text-2xl font-bold">{userActions.length}</div>
            </div>
          </Card>
          <Card className="p-4">
            <div>
              <div className="text-sm text-gray-500">Progresso</div>
              <div className="mt-2">
                <Progress value={(character?.xp / character?.maxXp) * 100 || 0} className="w-full h-2.5" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  /* GameScreen with Tabs (Ações | Combate | Conquistas | Ranking | Eventos) */
  const GameScreen = () => {
    if (!character) return null;
    const totalMaxXp = character.maxXp || 100;
    const xpPercent = (character.xp / totalMaxXp) * 100;
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
        {/* Barra superior profissional */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white/95 backdrop-blur-sm rounded-2xl p-4 mb-4 shadow-lg border border-white/60">
          {/* Lado esquerdo: avatar, nome, nível, streak e XP */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-4xl avatar-emoji shadow-inner">
              {character.avatar}
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              {/* Linha: nome + nível + streak */}
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h1 className="text-2xl font-bold truncate">{character.name}</h1>

                <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                  Nível {character.level}
                </Badge>

                {/* Streak integrado com nome/nível */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-[11px] font-semibold text-orange-700">
                  <span className="text-sm">🔥</span>
                  <span className="whitespace-nowrap">
                    {streakData.streak || 0} {(streakData.streak || 0) === 1 ? "dia" : "dias"}
                  </span>
                </div>
              </div>

              {/* Linha: barra de XP */}
              <div className="space-y-1">
                <Progress value={xpPercent} className="w-full md:w-[260px] h-2.5" />
                <p className="text-xs text-gray-500">
                  XP {character.xp}/{character.maxXp}
                </p>
              </div>
            </div>
          </div>

          {/* Lado direito: somente botão de sair */}
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="shadow-md border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg mb-4 tabs-list">
            <TabsTrigger value="actions" className="tabs-trigger"><Plus className="h-4 w-4 mr-2" /> Ações</TabsTrigger>
            <TabsTrigger value="combat" className="tabs-trigger"><Sword className="h-4 w-4 mr-2" /> Combate</TabsTrigger>
            <TabsTrigger value="achievements" className="tabs-trigger"><Leaf className="h-4 w-4 mr-2" /> Conquistas</TabsTrigger>
            <TabsTrigger value="ranking" className="tabs-trigger"><BadgeIcon className="h-4 w-4 mr-2" /> Ranking</TabsTrigger>
            <TabsTrigger value="events" className="tabs-trigger"><Leaf className="h-4 w-4 mr-2" /> Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="flex-grow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white drop-shadow">Ações Sustentáveis</h2>
              <Button onClick={() => setDialogOpen("registerAction")} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" /> Registrar Nova Ação</Button>
            </div>

            {userActions.length > 0 ? (
	              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
	                {userActions.map((action, index) => (
	                  <Card key={action.id || index} className="bg-white/90 backdrop-blur-sm shadow-md">
	                    <CardHeader>
	                      <CardTitle>{action.title}</CardTitle>
	                      <CardDescription className="break-words">{action.description}</CardDescription>
	                    </CardHeader>
	                    <CardContent>
	                      <div className="flex justify-between items-center mb-2">
	                        <Badge variant="secondary">{action.category}</Badge>
	                        <Badge variant="outline">{action.xpReward} XP</Badge>
	                      </div>
	                      {action.location && <p className="text-sm text-gray-600">Local: {action.location.lat.toFixed(5)}, {action.location.lng.toFixed(5)}</p>}
	                      {action.proof && (
	                        <p className="text-sm text-gray-600">
	                          Prova: {action.proof.type === 'image' ? (
	                            <a href={action.proof.value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Visualizar Imagem</a>
	                          ) : (
	                            action.proof.value
	                          )}
	                        </p>
	                      )}
	                      <p className="text-xs text-gray-500 mt-2">Data: {new Date(action.date).toLocaleDateString()}</p>
	                      <div className="flex gap-2 mt-4">
	                        <Button variant="outline" size="sm" onClick={() => setDialogOpen({ type: "editAction", action })}>Editar</Button>
	                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAction(action)}>Excluir</Button>
	                      </div>
	                    </CardContent>
	                  </Card>
	                ))}
	              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
                <Leaf className="h-16 w-16 text-green-600 mb-4" />
                <h3 className="2x1 font-bold text-center mb-2">Nenhuma ação registrada ainda</h3>
                <p className="text-center text-gray-600">Comece agora registrando uma ação sustentável!</p>
              </div>
            )}

            {dialogOpen === "registerAction" && <RegisterActionModal onClose={() => setDialogOpen(false)} />}
            {dialogOpen && dialogOpen.type === "editAction" && <RegisterActionModal initialAction={dialogOpen.action} onClose={() => setDialogOpen(false)} />}
          </TabsContent>

          <TabsContent value="combat" className="flex-grow p-4">
            {currentBattle ? (
              <div className="battle-container text-white p-6 rounded-lg max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col items-center">
                    <div className="text-5xl avatar-emoji">{character.avatar}</div>
                    <h3 className="font-bold">{character.name}</h3>
                    <Progress value={(currentBattle.playerHp / (character.maxHp || 100)) * 100} className="w-[150px] h-2.5 mt-2" />
                    <p className="text-sm mt-1">HP: {currentBattle.playerHp}/{character.maxHp}</p>
                  </div>
                  <div className="text-4xl font-bold">VS</div>
                  <div className="flex flex-col items-center">
                    <div className="text-5xl mb-2 villain-emoji">{currentBattle.villain.emoji}</div>
                    <h3 className="font-bold">{currentBattle.villain.name} (Nível {currentBattle.villain.level})</h3>
                    <Progress value={(currentBattle.villain.hp / currentBattle.villain.maxHp) * 100} className="w-[150px] h-2.5 mt-2" />
                    <p className="text-sm mt-1">HP: {currentBattle.villain.hp}/{currentBattle.villain.maxHp}</p>
                  </div>
                </div>

                <div className="battle-log mb-6">
                  {currentBattle.log.map((entry, index) => (
                    <p key={index} className={index === currentBattle.log.length - 1 ? "font-bold" : ""}>{entry}</p>
                  ))}
                </div>

                {currentBattle.turn === "player" && currentBattle.villain.hp > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={() => performAttack()} className="bg-green-600 hover:bg-green-700"><Leaf className="h-4 w-4 mr-2" /> Atacar</Button>
                  </div>
                ) : (
                  <p className="text-center text-lg italic">{currentBattle.villain.hp <= 0 ? "Vitória! O vilão foi derrotado!" : "Aguarde o ataque do inimigo..."}</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {villains.map((villain) => (
                  <Card key={villain.id} className="bg-white/90 backdrop-blur-sm shadow-md card">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-3xl villain-emoji">{villain.emoji}</span> {villain.name}
                        </CardTitle>
                        {character && <Badge variant="outline">Nível {character.level}</Badge>}
                      </div>
                      <CardDescription>{villain.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Ataque</p>
                          <Progress value={(villain.baseAttack / 25) * 100} className="h-2 mt-1" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Defesa</p>
                          <Progress value={(villain.baseDefense / 15) * 100} className="h-2 mt-1" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary">Inimigo Ambiental</Badge>
                        <Button onClick={() => startBattle(villain.id)} className="button">Atacar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="flex-grow p-4">
            <AchievementsScreen />
          </TabsContent>

          <TabsContent value="ranking" className="flex-grow p-4">
            <RankingScreen />
          </TabsContent>

          <TabsContent value="events" className="flex-grow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white drop-shadow">Eventos Sustentáveis</h2>
              <div className="flex items-center gap-2">
                <Button onClick={() => { setCreateEventModalOpen(true); }} className="bg-green-600 hover:bg-green-700"><Plus className="h-4 w-4 mr-2" /> Novo Evento</Button>
                <Button variant="outline" onClick={() => loadEvents()}>Atualizar</Button>
              </div>
            </div>

            {/* LISTAGEM DOS EVENTOS (cards) - com thumbnail e distância */}
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {events.map((evt) => {
                  const distance = userCoords ? haversineDistance(userCoords.lat, userCoords.lng, evt.location.lat, evt.location.lng) : "—";
                  return (
                    <Card
                      key={evt.id}
                      className="bg-white/90 backdrop-blur-sm shadow-md cursor-pointer hover:shadow-lg transition overflow-hidden"
                      onClick={() => {
                        setSelectedEvent(evt);
                        setEventModalOpen(true);
                      }}
                    >
                      <CardHeader className="p-3">
                        <div className="flex gap-3 items-start">
                          <div className="flex-shrink-0">
                            <EventThumbnail location={evt.location} />
                          </div>

                          {/* content container with min-w-0 to allow truncation */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div className="min-w-0">
                                <CardTitle className="font-bold truncate">{evt.name}</CardTitle>
                                <CardDescription className="text-sm text-gray-700 line-clamp-2 break-words overflow-hidden">{evt.description}</CardDescription>
                              </div>

                              <div className="text-right ml-3 flex-shrink-0">
                                <div className="text-xs text-gray-500">{distance}</div>
                                <div className="text-xs text-gray-400 mt-1">{evt.createdAt ? (evt.createdAt.seconds ? new Date(evt.createdAt.seconds * 1000).toLocaleDateString() : new Date(evt.createdAt).toLocaleDateString()) : "—"}</div>
                              </div>
                            </div>

                            {/* Footer with buttons aligned to right */}
                            <div className="mt-3 flex items-center">
                              <div className="ml-auto flex gap-2">
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleConfirmEvent(evt.id); }} disabled={(actionLoadingMap[evt.id] && actionLoadingMap[evt.id].confirming) || false}>
                                  {(actionLoadingMap[evt.id] && actionLoadingMap[evt.id].confirming) ? "Confirmando..." : "Confirmar"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleReportEvent(evt.id); }} disabled={(actionLoadingMap[evt.id] && actionLoadingMap[evt.id].reporting) || false}>
                                  {(actionLoadingMap[evt.id] && actionLoadingMap[evt.id].reporting) ? "Reportando..." : "Reportar"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center bg-white/90 rounded-lg shadow">
                Nenhum evento encontrado.
              </div>
            )}

            {createEventModalOpen && <CreateEventModal onClose={() => setCreateEventModalOpen(false)} />}
          </TabsContent>
        </Tabs>

        <NotificationComponent />
      </div>
    );
  };

  /* App-level loading */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
        <div className="text-white text-2xl flex flex-col items-center">
          <div className="animate-spin text-5xl mb-4">🌍</div>
          Carregando EcoQuest...
        </div>
      </div>
    );
  }

  return (
    <>
      {notification && <NotificationComponent />}
      {currentScreen === "login" && <LoginScreen />}
      {currentScreen === "register" && <RegisterScreen />}
      {currentScreen === "character-creation" && <CharacterCreationScreen />}
      {currentScreen === "game" && <GameScreen />}

      {/* Modal de detalhe do evento */}
      {eventModalOpen && selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => { setEventModalOpen(false); setSelectedEvent(null); }} />
      )}
    </>
  );
}

export default App;
