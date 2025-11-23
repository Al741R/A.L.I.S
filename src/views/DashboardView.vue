<template>
  <div class="admin-dashboard">
    <DashSidebarSubsection />
    <div class="dashboard-main">
      <AdminTopBar class="frame-128-instance" />
      <FrameSubsection />
    </div>
  </div>
</template>
<script setup>
import DashSidebarSubsection from '@/components/admin/DashSidebarSubsection.vue'
import AdminTopBar from '@/components/admin/Frame128.vue'
import FrameSubsection from '@/components/admin/FrameSubsection.vue'
</script>
<style scoped>
.admin-dashboard {
  background-color: #ffffff;
  min-height: 1024px;
  min-width: 1440px;
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: row;
  font-family: Poppins, sans-serif;
}
.dashboard-main {
  flex: 1;
  padding: 32px 48px 64px 300px; /* space for sidebar */
  box-sizing: border-box;
}
.frame-128-instance {
  position: sticky;
  top: 0;
  display: block;
  margin-bottom: 32px;
  z-index: 10;
}
@media (max-width: 1200px) {
  .dashboard-main {
    padding-left: 240px;
  }
}
@media (max-width: 900px) {
  .admin-dashboard {
    flex-direction: column;
    min-width: 0;
  }
  .dashboard-main {
    padding: 24px 20px 60px 20px;
  }
}
</style>
