const ARCHIVE_KEY = 'armory_archived_guns'

export const getArchivedGuns = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const isGunArchived = (gunId) => {
  if (!gunId) return false
  const list = getArchivedGuns()
  return list.some((item) => String(item.id) === String(gunId))
}

export const archiveGun = (gun) => {
  if (!gun || !gun.id) return false
  try {
    const list = getArchivedGuns()
    const exists = list.some((item) => String(item.id) === String(gun.id))
    if (!exists) {
      const archivedItem = {
        ...gun,
        archivedAt: new Date().toISOString(),
      }
      list.unshift(archivedItem)
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list))
      window.dispatchEvent(new Event('armory_archive_updated'))
    }
    return true
  } catch {
    return false
  }
}

export const restoreGun = (gunId) => {
  if (!gunId) return false
  try {
    const list = getArchivedGuns()
    const filtered = list.filter((item) => String(item.id) !== String(gunId))
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new Event('armory_archive_updated'))
    return true
  } catch {
    return false
  }
}

export const permanentlyDeleteGun = (gunId) => {
  if (!gunId) return false
  try {
    const list = getArchivedGuns()
    const filtered = list.filter((item) => String(item.id) !== String(gunId))
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new Event('armory_archive_updated'))
    return true
  } catch {
    return false
  }
}
