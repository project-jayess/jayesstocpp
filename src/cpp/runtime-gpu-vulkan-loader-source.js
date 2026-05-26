export function getGpuVulkanLoaderCppFragment() {
  return `using jayess_vk_instance = void*;
using jayess_vk_result = int;
using jayess_vk_get_instance_proc_addr_fn = void* (*)(jayess_vk_instance, const char*);

struct jayess_vk_application_info {
  std::uint32_t sType = 0;
  const void* pNext = nullptr;
  const char* pApplicationName = nullptr;
  std::uint32_t applicationVersion = 0;
  const char* pEngineName = nullptr;
  std::uint32_t engineVersion = 0;
  std::uint32_t apiVersion = 0;
};

struct jayess_vk_instance_create_info {
  std::uint32_t sType = 0;
  const void* pNext = nullptr;
  std::uint32_t flags = 0;
  const jayess_vk_application_info* pApplicationInfo = nullptr;
  std::uint32_t enabledLayerCount = 0;
  const char* const* ppEnabledLayerNames = nullptr;
  std::uint32_t enabledExtensionCount = 0;
  const char* const* ppEnabledExtensionNames = nullptr;
};

using jayess_vk_create_instance_fn = jayess_vk_result (*)(const jayess_vk_instance_create_info*, const void*, jayess_vk_instance*);
using jayess_vk_destroy_instance_fn = void (*)(jayess_vk_instance, const void*);

struct jayess_vulkan_gpu_api {
  void* library = nullptr;
  jayess_vk_get_instance_proc_addr_fn get_instance_proc_addr = nullptr;
  jayess_vk_create_instance_fn create_instance = nullptr;
  jayess_vk_destroy_instance_fn destroy_instance = nullptr;
  bool attempted = false;
  bool instance_probe_ok = false;
};

constexpr jayess_vk_result jayess_vk_success = 0;
constexpr std::uint32_t jayess_vk_structure_type_application_info = 0;
constexpr std::uint32_t jayess_vk_structure_type_instance_create_info = 1;
constexpr std::uint32_t jayess_vk_api_version_1_0 = 4194304U;

jayess_vulkan_gpu_api& gpu_vulkan_api() {
  static jayess_vulkan_gpu_api api;
  if (api.attempted) {
    return api;
  }
  api.attempted = true;
#if defined(__linux__)
  api.library = dlopen("libvulkan.so.1", RTLD_LAZY | RTLD_LOCAL);
  if (api.library == nullptr) {
    return api;
  }
  api.get_instance_proc_addr = reinterpret_cast<jayess_vk_get_instance_proc_addr_fn>(dlsym(api.library, "vkGetInstanceProcAddr"));
  if (api.get_instance_proc_addr == nullptr) {
    return api;
  }
  api.create_instance = reinterpret_cast<jayess_vk_create_instance_fn>(api.get_instance_proc_addr(nullptr, "vkCreateInstance"));
  if (api.create_instance == nullptr) {
    return api;
  }
  jayess_vk_application_info appInfo{};
  appInfo.sType = jayess_vk_structure_type_application_info;
  appInfo.pApplicationName = "Jayess";
  appInfo.applicationVersion = 1;
  appInfo.pEngineName = "Jayess";
  appInfo.engineVersion = 1;
  appInfo.apiVersion = jayess_vk_api_version_1_0;

  jayess_vk_instance_create_info createInfo{};
  createInfo.sType = jayess_vk_structure_type_instance_create_info;
  createInfo.pApplicationInfo = &appInfo;

  jayess_vk_instance instance = nullptr;
  const auto result = api.create_instance(&createInfo, nullptr, &instance);
  if (result == jayess_vk_success && instance != nullptr) {
    api.destroy_instance = reinterpret_cast<jayess_vk_destroy_instance_fn>(api.get_instance_proc_addr(instance, "vkDestroyInstance"));
    if (api.destroy_instance != nullptr) {
      api.instance_probe_ok = true;
      api.destroy_instance(instance, nullptr);
    }
  }
#endif
  return api;
}`;
}
