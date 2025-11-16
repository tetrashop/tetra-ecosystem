import numpy as np
import cv2
from scipy import ndimage
from scipy.spatial import Delaunay
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import multiprocessing as mp
from concurrent.futures import ThreadPoolExecutor
import numba
from numba import jit, prange
import time
from typing import Tuple, List
import json

class Advanced2DTo3DConverter:
    def __init__(self, output_resolution: int = 512):
        self.output_resolution = output_resolution
        self.num_processes = mp.cpu_count()
        
    @jit(nopython=True, parallel=True, fastmath=True)
    def spherical_mapping_optimized(self, depth_map: np.ndarray, 
                                  gradient_x: np.ndarray, 
                                  gradient_y: np.ndarray) -> np.ndarray:
        """
        نگاشت کروی بهینه‌شده با استفاده از Numba برای سرعت بالا
        """
        h, w = depth_map.shape
        spherical_coords = np.zeros((h, w, 3), dtype=np.float32)
        
        center_x, center_y = w // 2, h // 2
        max_radius = min(center_x, center_y) * 0.9
        
        for i in prange(h):
            for j in prange(w):
                # مختصات نرمالایز شده
                nx = (j - center_x) / max_radius
                ny = (i - center_y) / max_radius
                
                # فاصله از مرکز
                r = np.sqrt(nx*nx + ny*ny)
                
                if r <= 1.0:
                    # تبدیل به مختصات کروی
                    theta = np.arcsin(r) * 2
                    phi = np.arctan2(ny, nx)
                    
                    # اعمال عمق و گرادیان
                    depth_factor = depth_map[i, j]
                    grad_factor = (gradient_x[i, j] + gradient_y[i, j]) * 0.5
                    
                    # محاسبه مختصات 3D
                    x = np.sin(theta) * np.cos(phi) * (1 + depth_factor * 0.3 + grad_factor * 0.1)
                    y = np.sin(theta) * np.sin(phi) * (1 + depth_factor * 0.3 + grad_factor * 0.1)
                    z = np.cos(theta) * (1 + depth_factor * 0.5)
                    
                    spherical_coords[i, j] = [x, y, z]
        
        return spherical_coords

    @jit(nopython=True, fastmath=True)
    def calculate_depth_map_optimized(self, image: np.ndarray) -> np.ndarray:
        """
        محاسبه نقشه عمق بهینه‌شده با الگوریتم‌های پیشرفته
        """
        h, w = image.shape[:2]
        depth_map = np.zeros((h, w), dtype=np.float32)
        
        # تبدیل به grayscale با وزن‌های بهینه
        if len(image.shape) == 3:
            gray = image[:,:,0] * 0.299 + image[:,:,1] * 0.587 + image[:,:,2] * 0.114
        else:
            gray = image
        
        # فیلتر گاوسین برای هموارسازی
        for i in range(1, h-1):
            for j in range(1, w-1):
                gauss_sum = (gray[i-1, j-1] + gray[i-1, j] + gray[i-1, j+1] +
                           gray[i, j-1] + gray[i, j] * 4 + gray[i, j+1] +
                           gray[i+1, j-1] + gray[i+1, j] + gray[i+1, j+1])
                gray[i, j] = gauss_sum / 13
        
        # محاسبه گرادیان‌ها با Sobel operator
        for i in range(1, h-1):
            for j in range(1, w-1):
                gx = (gray[i-1, j+1] + 2*gray[i, j+1] + gray[i+1, j+1] -
                      gray[i-1, j-1] - 2*gray[i, j-1] - gray[i+1, j-1])
                
                gy = (gray[i+1, j-1] + 2*gray[i+1, j] + gray[i+1, j+1] -
                      gray[i-1, j-1] - 2*gray[i-1, j] - gray[i-1, j+1])
                
                gradient_magnitude = np.sqrt(gx*gx + gy*gy)
                depth_map[i, j] = gradient_magnitude / 1440.0  # نرمالایز
        
        return depth_map

    def parallel_feature_extraction(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        استخراج موازی ویژگی‌ها با استفاده از چندین پردازنده
        """
        with ThreadPoolExecutor(max_workers=self.num_processes) as executor:
            # تقسیم تصویر به بخش‌ها برای پردازش موازی
            h, w = image.shape[:2]
            chunk_h = h // self.num_processes
            
            futures = []
            for i in range(self.num_processes):
                start_h = i * chunk_h
                end_h = (i + 1) * chunk_h if i < self.num_processes - 1 else h
                chunk = image[start_h:end_h]
                futures.append(executor.submit(self.process_image_chunk, chunk))
            
            # جمع‌آوری نتایج
            results = [f.result() for f in futures]
        
        # ترکیب نتایج
        depth_chunks, gradient_x_chunks, gradient_y_chunks = zip(*results)
        
        depth_map = np.vstack(depth_chunks)
        gradient_x = np.vstack(gradient_x_chunks)
        gradient_y = np.vstack(gradient_y_chunks)
        
        return depth_map, gradient_x, gradient_y

    def process_image_chunk(self, image_chunk: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        پردازش یک بخش از تصویر
        """
        depth_map = self.calculate_depth_map_optimized(image_chunk)
        
        # محاسبه گرادیان‌ها
        gradient_x = ndimage.sobel(image_chunk, axis=1) if len(image_chunk.shape) == 2 else \
                    ndimage.sobel(image_chunk.mean(axis=2), axis=1)
        gradient_y = ndimage.sobel(image_chunk, axis=0) if len(image_chunk.shape) == 2 else \
                    ndimage.sobel(image_chunk.mean(axis=2), axis=0)
        
        return depth_map, gradient_x, gradient_y

    def adaptive_mesh_generation(self, spherical_coords: np.ndarray, 
                               depth_map: np.ndarray, 
                               quality: str = 'high') -> Tuple[np.ndarray, np.ndarray]:
        """
        تولید مش تطبیقی با تراکم متغیر بر اساس پیچیدگی مناطق
        """
        h, w = spherical_coords.shape[:2]
        
        # تعیین تراکم مش بر اساس کیفیت
        if quality == 'high':
            step = 2
            detail_threshold = 0.1
        elif quality == 'medium':
            step = 3
            detail_threshold = 0.15
        else:  # low
            step = 4
            detail_threshold = 0.2
        
        vertices = []
        faces = []
        
        # تولید نقاط با تراکم تطبیقی
        for i in range(0, h, step):
            for j in range(0, w, step):
                # بررسی پیچیدگی منطقه برای تعیین تراکم
                local_detail = self.calculate_local_detail(depth_map, i, j, step)
                
                if local_detail > detail_threshold and quality != 'low':
                    # تراکم بیشتر در مناطق پیچیده
                    sub_step = max(1, step // 2)
                    for si in range(i, min(i+step, h), sub_step):
                        for sj in range(j, min(j+step, w), sub_step):
                            if si < h and sj < w:
                                vertices.append(spherical_coords[si, sj])
                else:
                    # تراکم معمولی
                    vertices.append(spherical_coords[i, j])
        
        vertices = np.array(vertices)
        
        # تولید مثلث‌ها با الگوریتم Delaunay
        if len(vertices) > 3:
            # پروژکت کردن به 2D برای triangulation
            points_2d = vertices[:, :2]
            tri = Delaunay(points_2d)
            faces = tri.simplices
        
        return vertices, faces

    def calculate_local_detail(self, depth_map: np.ndarray, i: int, j: int, window_size: int) -> float:
        """
        محاسبه میزان پیچیدگی محلی برای تعیین تراکم مش
        """
        h, w = depth_map.shape
        start_i = max(0, i - window_size//2)
        end_i = min(h, i + window_size//2)
        start_j = max(0, j - window_size//2)
        end_j = min(w, j + window_size//2)
        
        region = depth_map[start_i:end_i, start_j:end_j]
        if region.size == 0:
            return 0.0
        
        # واریانس منطقه به عنوان معیار پیچیدگی
        return np.var(region)

    def polynomial_curve_optimization(self, vertices: np.ndarray, 
                                    faces: np.ndarray, 
                                    degree: int = 3) -> np.ndarray:
        """
        بهینه‌سازی منحنی‌های چندجمله‌ای برای هموارسازی سطح
        """
        optimized_vertices = vertices.copy()
        
        for face in faces:
            if len(face) == 3:
                # نقاط مثلث
                A, B, C = vertices[face]
                
                # محاسبه نرمال
                normal = np.cross(B - A, C - A)
                normal = normal / (np.linalg.norm(normal) + 1e-8)
                
                # اعمال هموارسازی چندجمله‌ای
                for idx in face:
                    # میانگین‌گیری از همسایگان
                    neighbor_indices = self.find_vertex_neighbors(idx, faces)
                    if neighbor_indices:
                        neighbor_avg = np.mean(vertices[neighbor_indices], axis=0)
                        # اعمال منحنی چندجمله‌ای
                        t = 0.1  # ضریب هموارسازی
                        optimized_vertices[idx] = (1-t) * vertices[idx] + t * neighbor_avg
        
        return optimized_vertices

    def find_vertex_neighbors(self, vertex_idx: int, faces: np.ndarray) -> List[int]:
        """
        یافتن همسایگان یک رأس در مش
        """
        neighbors = set()
        for face in faces:
            if vertex_idx in face:
                for idx in face:
                    if idx != vertex_idx:
                        neighbors.add(idx)
        return list(neighbors)

    def export_3d_model(self, vertices: np.ndarray, faces: np.ndarray, 
                       output_format: str = 'obj') -> str:
        """
        خروجی مدل 3D در فرمت‌های مختلف
        """
        if output_format.lower() == 'obj':
            return self.export_to_obj(vertices, faces)
        elif output_format.lower() == 'stl':
            return self.export_to_stl(vertices, faces)
        elif output_format.lower() == 'gltf':
            return self.export_to_gltf(vertices, faces)
        else:
            raise ValueError(f"فرمت پشتیبانی نشده: {output_format}")

    def export_to_obj(self, vertices: np.ndarray, faces: np.ndarray) -> str:
        """
        خروجی به فرمت OBJ
        """
        obj_content = "# مدل 3D تولید شده توسط Tetra Advanced Converter\n"
        
        # رئوس
        for v in vertices:
            obj_content += f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n"
        
        # صفحات
        for f in faces:
            if len(f) == 3:
                obj_content += f"f {f[0]+1} {f[1]+1} {f[2]+1}\n"
        
        return obj_content

    def export_to_stl(self, vertices: np.ndarray, faces: np.ndarray) -> str:
        """
        خروجی به فرمت STL (متن)
        """
        stl_content = "solid Tetra_3D_Model\n"
        
        for face in faces:
            if len(face) == 3:
                A, B, C = vertices[face]
                normal = np.cross(B - A, C - A)
                normal = normal / (np.linalg.norm(normal) + 1e-8)
                
                stl_content += f"facet normal {normal[0]:.6f} {normal[1]:.6f} {normal[2]:.6f}\n"
                stl_content += "  outer loop\n"
                stl_content += f"    vertex {A[0]:.6f} {A[1]:.6f} {A[2]:.6f}\n"
                stl_content += f"    vertex {B[0]:.6f} {B[1]:.6f} {B[2]:.6f}\n"
                stl_content += f"    vertex {C[0]:.6f} {C[1]:.6f} {C[2]:.6f}\n"
                stl_content += "  endloop\n"
                stl_content += "endfacet\n"
        
        stl_content += "endsolid Tetra_3D_Model\n"
        return stl_content

    def export_to_gltf(self, vertices: np.ndarray, faces: np.ndarray) -> str:
        """
        خروجی به فرمت GLTF (ساده)
        """
        gltf_data = {
            "scenes": [{"nodes": [0]}],
            "nodes": [{"mesh": 0}],
            "meshes": [{
                "primitives": [{
                    "attributes": {"POSITION": 1},
                    "indices": 0
                }]
            }],
            "accessors": [
                {
                    "bufferView": 1,
                    "componentType": 5123,
                    "count": len(faces) * 3,
                    "type": "SCALAR"
                },
                {
                    "bufferView": 2,
                    "componentType": 5126,
                    "count": len(vertices),
                    "type": "VEC3",
                    "max": vertices.max(axis=0).tolist(),
                    "min": vertices.min(axis=0).tolist()
                }
            ],
            "bufferViews": [
                {
                    "buffer": 0,
                    "byteOffset": 0,
                    "byteLength": len(faces) * 3 * 4,
                    "target": 34963
                },
                {
                    "buffer": 0,
                    "byteOffset": len(faces) * 3 * 4,
                    "byteLength": len(vertices) * 3 * 4,
                    "target": 34962
                }
            ],
            "buffers": [{
                "byteLength": len(faces) * 3 * 4 + len(vertices) * 3 * 4,
                "uri": "data:application/octet-stream;base64," + 
                       self.array_to_base64(faces, vertices)
            }]
        }
        
        return json.dumps(gltf_data, indent=2)

    def array_to_base64(self, faces: np.ndarray, vertices: np.ndarray) -> str:
        """
        تبدیل آرایه‌ها به base64 برای GLTF
        """
        import base64
        faces_uint16 = faces.astype(np.uint16).flatten()
        vertices_float32 = vertices.astype(np.float32).flatten()
        
        buffer = np.concatenate([faces_uint16, vertices_float32])
        return base64.b64encode(buffer.tobytes()).decode('utf-8')

    def convert_2d_to_3d(self, image_path: str, 
                        output_format: str = 'obj',
                        quality: str = 'high') -> str:
        """
        تابع اصلی تبدیل 2D به 3D
        """
        print("📥 در حال بارگذاری تصویر...")
        start_time = time.time()
        
        # بارگذاری تصویر
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"نمی‌توان تصویر را بارگذاری کرد: {image_path}")
        
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (self.output_resolution, self.output_resolution))
        
        print("🔍 استخراج ویژگی‌ها به صورت موازی...")
        # استخراج موازی ویژگی‌ها
        depth_map, gradient_x, gradient_y = self.parallel_feature_extraction(image)
        
        print("🌐 انجام نگاشت کروی...")
        # نگاشت کروی
        spherical_coords = self.spherical_mapping_optimized(depth_map, gradient_x, gradient_y)
        
        print("🔄 تولید مش تطبیقی...")
        # تولید مش
        vertices, faces = self.adaptive_mesh_generation(spherical_coords, depth_map, quality)
        
        print("⚡ بهینه‌سازی سطح با منحنی‌های چندجمله‌ای...")
        # بهینه‌سازی سطح
        optimized_vertices = self.polynomial_curve_optimization(vertices, faces)
        
        print("💾 تولید خروجی 3D...")
        # خروجی نهایی
        result = self.export_3d_model(optimized_vertices, faces, output_format)
        
        end_time = time.time()
        print(f"✅ تبدیل کامل شد! زمان اجرا: {end_time - start_time:.2f} ثانیه")
        print(f"📊 آمار: {len(vertices)} رأس, {len(faces)} صفحه")
        
        return result

# استفاده نمونه
if __name__ == "__main__":
    converter = Advanced2DTo3DConverter(output_resolution=1024)
    
    try:
        # تبدیل تصویر
        model_3d = converter.convert_2d_to_3d(
            image_path="input_image.jpg",
            output_format="obj",
            quality="high"
        )
        
        # ذخیره نتیجه
        with open("output_model.obj", "w") as f:
            f.write(model_3d)
            
        print("🎉 مدل 3D با موفقیت تولید و ذخیره شد!")
        
    except Exception as e:
        print(f"❌ خطا: {e}")
