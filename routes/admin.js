// Dashboard data
GET    /api/admin/dashboard              // Alle data voor admin dashboard

// Bulk operations
POST   /api/admin/orders/bulk-update     // Update meerdere bestellingen
POST   /api/admin/drivers/bulk-assign    // Wijs meerdere drivers toe

// Settings
GET    /api/admin/settings                // App instellingen
PATCH  /api/admin/settings                // Update instellingen
```

**Prioriteit:** ⭐ (Could have)

---

## 📁 Complete Folder Structuur
```
pizzeria-app/
├── routes/
│   ├── branches.js         ⭐⭐⭐ Must have
│   ├── drivers.js          ⭐⭐⭐ Must have
│   ├── orders.js           ⭐⭐⭐ Must have
│   ├── reservations.js     ⭐⭐ Should have
│   ├── tracking.js         ⭐⭐⭐ Must have (GPS)
│   ├── analytics.js        ⭐⭐ Should have (Geo-ICT!)
│   ├── auth.js             ⭐ Could have
│   └── admin.js            ⭐ Could have
├── server.js
└── configs/
    └── database.js
```

---

## 🎯 Prioritering: Wat Eerst Bouwen?

### **FASE 1: Core Functionaliteit (Week 1-4)**
```
✅ branches.js     - Vestigingen beheren
✅ drivers.js      - Drivers beheren
✅ orders.js       - Bestellingen plaatsen/beheren
```

### **FASE 2: Real-time Features (Week 5-6)**
```
✅ tracking.js     - GPS tracking
✅ Socket.IO       - Live updates
```

### **FASE 3: Extra Features (Week 7-8)**
```
✅ reservations.js - Tafelreservaties
✅ analytics.js    - Heat maps & statistieken
```

### **FASE 4: Polish (Week 9-10)**
```
⭐ auth.js         - Login systeem
⭐ admin.js        - Admin panel