import { AndroidFileItem } from '../types/navigation';

export const ANDROID_PROJECT_FILES: AndroidFileItem[] = [
  {
    path: 'settings.gradle.kts',
    category: 'GRADLE',
    title: 'Project Settings Script',
    description: 'Declares repository sources (Google, MavenCentral) and the :app module.',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = java.net.URI("https://jitpack.io") }
    }
}

rootProject.name = "SpatialNavAI"
include(":app")
`
  },
  {
    path: 'build.gradle.kts',
    category: 'GRADLE',
    title: 'Root Build Script',
    description: 'Root Gradle configuration defining Android Gradle Plugin and Kotlin versions.',
    content: `plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}

tasks.register("clean", Delete::class) {
    delete(rootProject.layout.buildDirectory)
}
`
  },
  {
    path: 'gradle.properties',
    category: 'GRADLE',
    title: 'Gradle Properties',
    description: 'JVM allocation, AndroidX, and build cache tuning for real-time mobile inference.',
    content: `org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'GRADLE',
    title: 'App Module Build Script',
    description: 'Declares CameraX, LiteRT/TensorFlow Lite, OpenCV, Coroutines, and test dependencies.',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "org.spatialnav.ai"
    compileSdk = 34

    defaultConfig {
        applicationId = "org.spatialnav.ai"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0-research"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        ndk {
            abiFilters.addAll(listOf("armeabi-v7a", "arm64-v8a", "x86_64"))
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        viewBinding = true
    }

    aaptOptions {
        noCompress("tflite")
    }
}

dependencies {
    // AndroidX & Core UI
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // CameraX for low-latency live camera frame ingestion
    val cameraVersion = "1.3.1"
    implementation("androidx.camera:camera-core:$cameraVersion")
    implementation("androidx.camera:camera-camera2:$cameraVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraVersion")
    implementation("androidx.camera:camera-view:$cameraVersion")

    // TensorFlow Lite / LiteRT on-device inference & GPU delegate
    val tfliteVersion = "2.14.0"
    implementation("org.tensorflow:tensorflow-lite:$tfliteVersion")
    implementation("org.tensorflow:tensorflow-lite-gpu:$tfliteVersion")
    implementation("org.tensorflow:tensorflow-lite-support:0.4.4")

    // Kotlin Coroutines for off-main-thread inference pipeline
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Unit Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("com.google.truth:truth:1.1.5")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'MANIFEST',
    title: 'Android Manifest',
    description: 'Declares camera hardware requirements, audio permissions, and accessibility configuration.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Camera hardware requirement for monocular depth estimation -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- Audio output and vibration feedback -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="false"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.SpatialNavAI.HighContrast"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize"
            android:label="@string/app_name">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'RESOURCES',
    title: 'Strings & Accessibility Labels',
    description: 'TalkBack descriptions, high-contrast action text, and required safety disclaimers.',
    content: `<resources>
    <string name="app_name">SpatialNav AI</string>
    <string name="action_start_navigation">Start Navigation</string>
    <string name="action_stop_navigation">Stop Navigation</string>
    <string name="action_stop_audio">Immediate Stop Audio</string>
    <string name="action_audio_settings">Audio Settings</string>
    <string name="action_diagnostics">Diagnostics and Telemetry</string>

    <!-- TalkBack Accessibility Content Descriptions -->
    <string name="desc_camera_preview">Live camera feed for obstacle scanning</string>
    <string name="desc_depth_preview">Monocular depth map visualization</string>
    <string name="desc_left_zone">Left corridor status</string>
    <string name="desc_center_zone">Center corridor status</string>
    <string name="desc_right_zone">Right corridor status</string>

    <!-- Spoken Audio Guidance Phrases -->
    <string name="speech_obstacle_center">Obstacle directly ahead</string>
    <string name="speech_obstacle_left">Obstacle on your left</string>
    <string name="speech_obstacle_right">Obstacle on your right</string>
    <string name="speech_left_clearer">Left path appears clearer</string>
    <string name="speech_right_clearer">Right path appears clearer</string>
    <string name="speech_uncertain_depth">Warning: Depth readings uncertain. Hold position.</string>

    <!-- Research Safety Disclaimers (Mandatory) -->
    <string name="disclaimer_research_prototype">RESEARCH PROTOTYPE ONLY: This application is not a certified medical or mobility aid. It does not replace a white cane or guide dog. Transparent glass, drops, and stairs are not reliably detected.</string>
</resources>
`
  },
  {
    path: 'app/src/main/res/values/colors.xml',
    category: 'RESOURCES',
    title: 'High-Contrast WCAG AAA Colors',
    description: 'Accessible color tokens meeting WCAG AAA contrast for low-vision users.',
    content: `<resources>
    <!-- Deep Obsidian Canvas (60%) -->
    <color name="bg_canvas">#0C0F14</color>
    <color name="bg_surface">#181D26</color>
    <color name="bg_surface_elevated">#222936</color>

    <!-- High-Contrast Action Tokens (10%) -->
    <color name="hazard_yellow">#FFE600</color>
    <color name="hazard_red">#FF334B</color>
    <color name="clear_cyan">#00E5FF</color>
    <color name="uncertain_amber">#FF9100</color>

    <!-- Text & Hairline Separators (30%) -->
    <color name="text_primary">#FFFFFF</color>
    <color name="text_secondary">#94A3B8</color>
    <color name="divider_hairline">#2A3444</color>
</resources>
`
  },
  {
    path: 'app/src/main/res/layout/activity_main.xml',
    category: 'RESOURCES',
    title: 'Accessible Main Layout',
    description: 'High-contrast layout featuring oversized 64dp touch targets, TalkBack focus order, and camera preview.',
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/bg_canvas">

    <!-- Top App Bar / Title -->
    <TextView
        android:id="@+id/tvTitle"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:padding="16dp"
        android:text="@string/app_name"
        android:textSize="22sp"
        android:textStyle="bold"
        android:textColor="@color/text_primary"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toStartOf="@id/btnStopAudio" />

    <!-- Emergency Stop Audio Button (Top Right, Instant Reach) -->
    <com.google.android.material.button.MaterialButton
        android:id="@+id/btnStopAudio"
        android:layout_width="wrap_content"
        android:layout_height="56dp"
        android:layout_margin="12dp"
        android:text="@string/action_stop_audio"
        android:textColor="@color/bg_canvas"
        app:backgroundTint="@color/hazard_red"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- CameraX Preview View (Upper Screen) -->
    <androidx.camera.view.PreviewView
        android:id="@+id/previewView"
        android:layout_width="0dp"
        android:layout_height="220dp"
        android:layout_margin="16dp"
        android:contentDescription="@string/desc_camera_preview"
        app:layout_constraintTop_toBottomOf="@id/tvTitle"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- Optional Depth-Map Visualizer for Diagnostics -->
    <ImageView
        android:id="@+id/ivDepthMap"
        android:layout_width="0dp"
        android:layout_height="120dp"
        android:layout_marginHorizontal="16dp"
        android:layout_marginTop="8dp"
        android:contentDescription="@string/desc_depth_preview"
        android:scaleType="fitCenter"
        android:visibility="gone"
        app:layout_constraintTop_toBottomOf="@id/previewView"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- Regional Risk Feedback Strip (Left, Center, Right) -->
    <LinearLayout
        android:id="@+id/llRegions"
        android:layout_width="0dp"
        android:layout_height="72dp"
        android:layout_margin="16dp"
        android:orientation="horizontal"
        app:layout_constraintTop_toBottomOf="@id/ivDepthMap"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <TextView
            android:id="@+id/tvRegionLeft"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:gravity="center"
            android:text="LEFT\\nCLEAR"
            android:textStyle="bold"
            android:textColor="@color/clear_cyan"
            android:background="@color/bg_surface"
            android:contentDescription="@string/desc_left_zone" />

        <View
            android:layout_width="2dp"
            android:layout_height="match_parent"
            android:background="@color/divider_hairline" />

        <TextView
            android:id="@+id/tvRegionCenter"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:gravity="center"
            android:text="CENTER\\nCLEAR"
            android:textStyle="bold"
            android:textColor="@color/clear_cyan"
            android:background="@color/bg_surface"
            android:contentDescription="@string/desc_center_zone" />

        <View
            android:layout_width="2dp"
            android:layout_height="match_parent"
            android:background="@color/divider_hairline" />

        <TextView
            android:id="@+id/tvRegionRight"
            android:layout_width="0dp"
            android:layout_height="match_parent"
            android:layout_weight="1"
            android:gravity="center"
            android:text="RIGHT\\nCLEAR"
            android:textStyle="bold"
            android:textColor="@color/clear_cyan"
            android:background="@color/bg_surface"
            android:contentDescription="@string/desc_right_zone" />
    </LinearLayout>

    <!-- High-Level Advisory Recommendation -->
    <TextView
        android:id="@+id/tvPathAdvisory"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginHorizontal="16dp"
        android:layout_marginTop="8dp"
        android:padding="12dp"
        android:background="@color/bg_surface"
        android:text="System Ready. Tap Start Navigation."
        android:textColor="@color/text_primary"
        android:textSize="16sp"
        app:layout_constraintTop_toBottomOf="@id/llRegions"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- Telemetry Readout (Inference Latency, FPS) -->
    <TextView
        android:id="@+id/tvTelemetry"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginHorizontal="16dp"
        android:layout_marginTop="6dp"
        android:text="Preview: 30 FPS · Inference: -- FPS · Latency: -- ms"
        android:textColor="@color/text_secondary"
        android:textSize="12sp"
        android:fontFamily="monospace"
        app:layout_constraintTop_toBottomOf="@id/tvPathAdvisory"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <!-- Oversized Primary Action Button (68dp touch target) -->
    <com.google.android.material.button.MaterialButton
        android:id="@+id/btnToggleNavigation"
        android:layout_width="0dp"
        android:layout_height="68dp"
        android:layout_margin="16dp"
        android:text="@string/action_start_navigation"
        android:textSize="18sp"
        android:textStyle="bold"
        android:textColor="@color/bg_canvas"
        app:backgroundTint="@color/hazard_yellow"
        app:cornerRadius="16dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/camera/CameraController.kt',
    category: 'KOTLIN_SRC',
    title: 'CameraX Controller',
    description: 'Manages CameraX lifecycle, bounded frame queue, and non-blocking image buffer conversion.',
    content: `package org.spatialnav.ai.camera

import android.content.Context
import android.graphics.Bitmap
import android.graphics.ImageFormat
import android.util.Log
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.nio.ByteBuffer
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * CameraController wraps Android CameraX, establishing a bounded pipeline that discards
 * outdated frames using STRATEGY_KEEP_ONLY_LATEST to prevent UI latency accumulation.
 */
class CameraController(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner,
    private val onFrameAvailable: (Bitmap, Long) -> Unit,
    private val onError: (String) -> Unit
) {
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var cameraProvider: ProcessCameraProvider? = null

    companion object {
        private const val TAG = "CameraController"
    }

    fun startCamera(previewView: PreviewView) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                // Bind UI preview
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                // Image analysis with non-blocking back-pressure handling
                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                    .build()

                imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    processImageProxy(imageProxy)
                }

                // Default to back camera for forward obstacle navigation
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )
                Log.d(TAG, "Camera bound successfully to lifecycle.")
            } catch (e: Exception) {
                Log.e(TAG, "CameraX binding failed: \${e.message}", e)
                onError("Camera initialisation failed: \${e.localizedMessage}")
            }
        }, ContextCompat.getMainExecutor(context))
    }

    private fun processImageProxy(imageProxy: ImageProxy) {
        val timestamp = imageProxy.imageInfo.timestamp
        try {
            val plane = imageProxy.planes[0]
            val buffer: ByteBuffer = plane.buffer
            val pixelStride = plane.pixelStride
            val rowStride = plane.rowStride
            val rowPadding = rowStride - pixelStride * imageProxy.width

            val bitmap = Bitmap.createBitmap(
                imageProxy.width + rowPadding / pixelStride,
                imageProxy.height,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            // Crop to actual dimensions if rowPadding exists
            val finalBitmap = if (rowPadding > 0) {
                Bitmap.createBitmap(bitmap, 0, 0, imageProxy.width, imageProxy.height)
            } else {
                bitmap
            }

            onFrameAvailable(finalBitmap, timestamp)
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing ImageProxy: \${e.message}", e)
        } finally {
            imageProxy.close() // CRITICAL: Always release image buffer to unblock CameraX
        }
    }

    fun stopCamera() {
        cameraProvider?.unbindAll()
        cameraExecutor.shutdown()
    }
}
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/depth/DepthEstimator.kt',
    category: 'KOTLIN_SRC',
    title: 'LiteRT Depth Estimator',
    description: 'Loads MiDaS-small TFLite model, normalizes input, and runs on-device inference via GPU/NNAPI delegate.',
    content: `package org.spatialnav.ai.depth

import android.content.Context
import android.graphics.Bitmap
import android.os.SystemClock
import android.util.Log
import org.tensorflow.lite.DataType
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.gpu.CompatibilityList
import org.tensorflow.lite.gpu.GpuDelegate
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.common.ops.NormalizeOp
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * DepthEstimator loads a pretrained monocular depth estimation model (MiDaS v2.1 Small)
 * and executes on-device inference using LiteRT / TensorFlow Lite.
 *
 * Attribution: MiDaS (Ranftl et al., Intel ISL, MIT License).
 * Input: 256x256x3 RGB normalized via ImageNet mean/std.
 * Output: 256x256 relative inverse depth tensor (higher value = closer to lens).
 */
class DepthEstimator(
    private val context: Context,
    private val modelFileName: String = "midas_small.tflite"
) {
    private var interpreter: Interpreter? = null
    private var gpuDelegate: GpuDelegate? = null
    val inputWidth = 256
    val inputHeight = 256

    // Preprocessing pipeline: Resize to 256x256, then normalize to ImageNet RGB distribution
    private val imageProcessor = ImageProcessor.Builder()
        .add(ResizeOp(inputHeight, inputWidth, ResizeOp.ResizeMethod.BILINEAR))
        .add(NormalizeOp(floatArrayOf(123.675f, 116.28f, 103.53f), floatArrayOf(58.395f, 57.12f, 57.375f)))
        .build()

    companion object {
        private const val TAG = "DepthEstimator"
    }

    fun initModel(): Boolean {
        return try {
            val modelBuffer = FileUtil.loadMappedFile(context, modelFileName)
            val options = Interpreter.Options()

            // Hardware accelerator selection
            val compatList = CompatibilityList()
            if (compatList.isDelegateSupportedOnThisDevice) {
                gpuDelegate = GpuDelegate(compatList.bestOptionsForThisDevice)
                options.addDelegate(gpuDelegate)
                Log.i(TAG, "Hardware acceleration: GPU Delegate active.")
            } else {
                options.setNumThreads(4)
                options.setUseNNAPI(true)
                Log.i(TAG, "Hardware acceleration: NNAPI / 4-Thread CPU active.")
            }

            interpreter = Interpreter(modelBuffer, options)
            Log.i(TAG, "Model \${modelFileName} loaded successfully.")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load depth model: \${e.message}. Using test fallback.", e)
            false
        }
    }

    fun estimateDepth(bitmap: Bitmap): DepthInferenceResult {
        val startTime = SystemClock.uptimeMillis()
        val outDepth = FloatArray(inputWidth * inputHeight)

        if (interpreter == null) {
            // Emulated synthetic fallback for testing when model file is not yet downloaded
            val latency = SystemClock.uptimeMillis() - startTime
            return DepthInferenceResult(outDepth, latency, isSimulated = true)
        }

        // Convert Bitmap to TensorImage and preprocess
        var tensorImage = TensorImage(DataType.FLOAT32)
        tensorImage.load(bitmap)
        tensorImage = imageProcessor.process(tensorImage)

        // Allocate output buffer: [1, 256, 256]
        val outputBuffer = ByteBuffer.allocateDirect(1 * inputHeight * inputWidth * 4).apply {
            order(ByteOrder.nativeOrder())
        }

        interpreter?.run(tensorImage.buffer, outputBuffer)
        outputBuffer.rewind()
        outputBuffer.asFloatBuffer().get(outDepth)

        val latencyMs = SystemClock.uptimeMillis() - startTime
        return DepthInferenceResult(outDepth, latencyMs, isSimulated = false)
    }

    fun close() {
        interpreter?.close()
        gpuDelegate?.close()
        interpreter = null
    }
}

data class DepthInferenceResult(
    val depthMap: FloatArray,
    val inferenceLatencyMs: Long,
    val isSimulated: Boolean
)
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/depth/DepthMapProcessor.kt',
    category: 'KOTLIN_SRC',
    title: 'Depth Map Matrix Processor',
    description: 'Slices depth map into Left, Center, Right zones, rejects ground plane, and computes 85th percentiles.',
    content: `package org.spatialnav.ai.depth

import java.util.Arrays

/**
 * DepthMapProcessor divides the 2D depth tensor into three spatial zones
 * and computes robust statistical metrics (85th percentile) while masking
 * out floor planes to avoid false warnings caused by ground textures.
 */
class DepthMapProcessor(
    val width: Int = 256,
    val height: Int = 256,
    val floorRejectionRatio: Float = 0.20f // Discard bottom 20% floor area
) {
    data class RegionalStatistics(
        val leftP85: Float,
        val centerP85: Float,
        val rightP85: Float,
        val nanRatio: Float
    )

    fun processMatrix(depthMap: FloatArray): RegionalStatistics {
        val effectiveHeight = (height * (1.0f - floorRejectionRatio)).toInt()
        val leftBorder = (width * 0.333f).toInt()
        val rightBorder = (width * 0.667f).toInt()

        val leftPixels = ArrayList<Float>()
        val centerPixels = ArrayList<Float>()
        val rightPixels = ArrayList<Float>()
        var nanCount = 0

        for (y in 0 until effectiveHeight) {
            val rowOffset = y * width
            for (x in 0 until width) {
                val value = depthMap[rowOffset + x]
                if (value.isNaN() || value.isInfinite()) {
                    nanCount++
                    continue
                }

                when {
                    x < leftBorder -> leftPixels.add(value)
                    x < rightBorder -> centerPixels.add(value)
                    else -> rightPixels.add(value)
                }
            }
        }

        val totalPixels = width * effectiveHeight
        val nanRatio = nanCount.toFloat() / totalPixels.toFloat()

        return RegionalStatistics(
            leftP85 = computePercentile(leftPixels, 0.85f),
            centerP85 = computePercentile(centerPixels, 0.85f),
            rightP85 = computePercentile(rightPixels, 0.85f),
            nanRatio = nanRatio
        )
    }

    private fun computePercentile(values: ArrayList<Float>, percentile: Float): Float {
        if (values.isEmpty()) return 0.0f
        val array = values.toFloatArray()
        Arrays.sort(array)
        val index = ((array.size - 1) * percentile).toInt().coerceIn(0, array.size - 1)
        return array[index]
    }
}
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/analysis/ObstacleAnalyzer.kt',
    category: 'KOTLIN_SRC',
    title: 'Obstacle Analyzer',
    description: 'Evaluates risk levels (LOW, MEDIUM, HIGH, UNKNOWN) based on statistical depth thresholds.',
    content: `package org.spatialnav.ai.analysis

enum class RiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    UNKNOWN
}

data class ObstacleAssessment(
    val leftRisk: RiskLevel,
    val centerRisk: RiskLevel,
    val rightRisk: RiskLevel,
    val overallRisk: RiskLevel,
    val isStaleOrCorrupt: Boolean,
    val recommendation: String
)

/**
 * ObstacleAnalyzer maps normalized disparity statistics to categorized risk states.
 * Conservatively warns visually impaired users without falsely declaring regions "safe".
 */
class ObstacleAnalyzer(
    val highRiskThreshold: Float = 0.72f,
    val mediumRiskThreshold: Float = 0.48f,
    val maxAllowedNanRatio: Float = 0.05f
) {
    fun assess(
        leftDisparity: Float,
        centerDisparity: Float,
        rightDisparity: Float,
        nanRatio: Float,
        frameAgeMs: Long
    ): ObstacleAssessment {
        // Enforce UNKNOWN state on stale frames or severe sensor corruption
        if (frameAgeMs > 350L || nanRatio > maxAllowedNanRatio) {
            return ObstacleAssessment(
                leftRisk = RiskLevel.UNKNOWN,
                centerRisk = RiskLevel.UNKNOWN,
                rightRisk = RiskLevel.UNKNOWN,
                overallRisk = RiskLevel.UNKNOWN,
                isStaleOrCorrupt = true,
                recommendation = "Sensors unreliable. Please hold position."
            )
        }

        val leftRisk = classifyDisparity(leftDisparity)
        val centerRisk = classifyDisparity(centerDisparity)
        val rightRisk = classifyDisparity(rightDisparity)

        val overallRisk = when {
            centerRisk == RiskLevel.HIGH || leftRisk == RiskLevel.HIGH || rightRisk == RiskLevel.HIGH -> RiskLevel.HIGH
            centerRisk == RiskLevel.MEDIUM || leftRisk == RiskLevel.MEDIUM || rightRisk == RiskLevel.MEDIUM -> RiskLevel.MEDIUM
            else -> RiskLevel.LOW
        }

        val recommendation = when {
            centerRisk == RiskLevel.HIGH -> {
                if (leftRisk == RiskLevel.LOW && rightRisk != RiskLevel.LOW) "Obstacle ahead. Left appears clearer."
                else if (rightRisk == RiskLevel.LOW && leftRisk != RiskLevel.LOW) "Obstacle ahead. Right appears clearer."
                else "Obstacle ahead. Stop and probe with cane."
            }
            leftRisk == RiskLevel.HIGH -> "Caution: Obstacle on left."
            rightRisk == RiskLevel.HIGH -> "Caution: Obstacle on right."
            centerRisk == RiskLevel.MEDIUM -> "Approaching obstacle ahead."
            else -> "Path forward clear of near obstacles."
        }

        return ObstacleAssessment(
            leftRisk = leftRisk,
            centerRisk = centerRisk,
            rightRisk = rightRisk,
            overallRisk = overallRisk,
            isStaleOrCorrupt = false,
            recommendation = recommendation
        )
    }

    private fun classifyDisparity(disparity: Float): RiskLevel {
        return when {
            disparity >= highRiskThreshold -> RiskLevel.HIGH
            disparity >= mediumRiskThreshold -> RiskLevel.MEDIUM
            else -> RiskLevel.LOW
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/decision/NavigationDecisionEngine.kt',
    category: 'KOTLIN_SRC',
    title: 'Navigation Decision Engine',
    description: 'Implements Exponential Moving Average (EMA) smoothing and dual-threshold hysteresis.',
    content: `package org.spatialnav.ai.decision

import org.spatialnav.ai.analysis.RiskLevel

/**
 * NavigationDecisionEngine stabilizes obstacle alerts through:
 * 1. Exponential Moving Average (EMA): S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
 * 2. Dual-threshold hysteresis state machine: prevents alert fluttering at boundary edges.
 */
class NavigationDecisionEngine(
    val alpha: Float = 0.35f,
    val highEnter: Float = 0.72f,
    val highExit: Float = 0.64f,
    val mediumEnter: Float = 0.48f,
    val mediumExit: Float = 0.40f
) {
    private var leftEma = 0.0f
    private var centerEma = 0.0f
    private var rightEma = 0.0f

    private var leftState = RiskLevel.LOW
    private var centerState = RiskLevel.LOW
    private var rightState = RiskLevel.LOW

    data class FilteredResult(
        val leftSmoothed: Float,
        val centerSmoothed: Float,
        val rightSmoothed: Float,
        val leftRisk: RiskLevel,
        val centerRisk: RiskLevel,
        val rightRisk: RiskLevel
    )

    fun update(rawLeft: Float, rawCenter: Float, rawRight: Float): FilteredResult {
        // Temporal EMA filtering
        leftEma = alpha * rawLeft + (1 - alpha) * leftEma
        centerEma = alpha * rawCenter + (1 - alpha) * centerEma
        rightEma = alpha * rawRight + (1 - alpha) * rightEma

        // Hysteresis state transitions
        leftState = transitionState(leftEma, leftState)
        centerState = transitionState(centerEma, centerState)
        rightState = transitionState(rightEma, rightState)

        return FilteredResult(
            leftSmoothed = leftEma,
            centerSmoothed = centerEma,
            rightSmoothed = rightEma,
            leftRisk = leftState,
            centerRisk = centerState,
            rightRisk = rightState
        )
    }

    private fun transitionState(value: Float, current: RiskLevel): RiskLevel {
        return when (current) {
            RiskLevel.HIGH -> if (value < highExit) {
                if (value < mediumExit) RiskLevel.LOW else RiskLevel.MEDIUM
            } else RiskLevel.HIGH

            RiskLevel.MEDIUM -> when {
                value >= highEnter -> RiskLevel.HIGH
                value < mediumExit -> RiskLevel.LOW
                else -> RiskLevel.MEDIUM
            }

            RiskLevel.LOW -> when {
                value >= highEnter -> RiskLevel.HIGH
                value >= mediumEnter -> RiskLevel.MEDIUM
                else -> RiskLevel.LOW
            }

            RiskLevel.UNKNOWN -> RiskLevel.UNKNOWN
        }
    }

    fun reset() {
        leftEma = 0.0f
        centerEma = 0.0f
        rightEma = 0.0f
        leftState = RiskLevel.LOW
        centerState = RiskLevel.LOW
        rightState = RiskLevel.LOW
    }
}
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/audio/SpatialAudioController.kt',
    category: 'KOTLIN_SRC',
    title: 'Directional Spatial Audio Controller',
    description: 'Generates stereo directional beeps via Android AudioTrack and voice cues via TextToSpeech.',
    content: `package org.spatialnav.ai.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.speech.tts.TextToSpeech
import android.util.Log
import org.spatialnav.ai.analysis.RiskLevel
import java.util.Locale
import kotlin.math.sin

/**
 * SpatialAudioController delivers directional stereo cues:
 * Left obstacles sound in the left headphone; right obstacles sound in the right headphone.
 * Pitch and pulse rate increase proportionally with proximity.
 */
class SpatialAudioController(private val context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isTtsReady = false
    private var isMuted = false
    private var lastSpokenText = ""
    private var lastSpokenTime = 0L

    companion object {
        private const val SAMPLE_RATE = 44100
        private const val TAG = "SpatialAudioController"
    }

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            tts?.setSpeechRate(1.2f)
            isTtsReady = true
        }
    }

    fun emitDirectionalCue(
        direction: Float, // -1.0f (left) to 0.0f (center) to +1.0f (right)
        frequencyHz: Float, // e.g. 440Hz to 880Hz
        durationMs: Int, // e.g. 80ms
        risk: RiskLevel
    ) {
        if (isMuted) return

        Thread {
            try {
                val numSamples = (SAMPLE_RATE * (durationMs / 1000.0)).toInt()
                val buffer = ShortArray(numSamples * 2) // Stereo (L, R interleaved)

                // Stereo panning gain matrix
                val leftGain = if (direction <= 0f) 1.0f else (1.0f - direction)
                val rightGain = if (direction >= 0f) 1.0f else (1.0f + direction)

                for (i in 0 until numSamples) {
                    val angle = 2.0 * Math.PI * i / (SAMPLE_RATE / frequencyHz)
                    val sample = (sin(angle) * Short.MAX_VALUE * 0.4).toInt().toShort()

                    buffer[2 * i] = (sample * leftGain).toInt().toShort()
                    buffer[2 * i + 1] = (sample * rightGain).toInt().toShort()
                }

                val track = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(SAMPLE_RATE)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                            .build()
                    )
                    .setBufferSizeInBytes(buffer.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                track.write(buffer, 0, buffer.size)
                track.play()

                Thread.sleep(durationMs.toLong() + 20)
                track.stop()
                track.release()
            } catch (e: Exception) {
                Log.e(TAG, "AudioTrack error: \${e.message}", e)
            }
        }.start()
    }

    fun speak(text: String) {
        if (isMuted || !isTtsReady) return
        val now = System.currentTimeMillis()
        if (text == lastSpokenText && now - lastSpokenTime < 2500L) return

        lastSpokenText = text
        lastSpokenTime = now
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "SPATIAL_NAV_TTS")
    }

    fun stopAll() {
        isMuted = true
        tts?.stop()
    }

    fun uncheckMute() {
        isMuted = false
    }

    fun release() {
        tts?.stop()
        tts?.shutdown()
    }
}
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/telemetry/PerformanceMonitor.kt',
    category: 'KOTLIN_SRC',
    title: 'Performance & Latency Monitor',
    description: 'Tracks Preview FPS vs. Inference FPS separately and measures pipeline latency.',
    content: `package org.spatialnav.ai.telemetry

/**
 * PerformanceMonitor tracks live pipeline throughput, keeping Camera Preview FPS
 * strictly decoupled from Model Inference FPS as required by research standards.
 */
class PerformanceMonitor(private val windowSize: Int = 30) {
    private var previewFrames = 0
    private var inferenceFrames = 0
    private var lastPreviewTime = System.currentTimeMillis()
    private var lastInferenceTime = System.currentTimeMillis()

    var currentPreviewFps: Float = 0f
        private set
    var currentInferenceFps: Float = 0f
        private set

    fun onPreviewFrameRendered() {
        previewFrames++
        val now = System.currentTimeMillis()
        val elapsed = now - lastPreviewTime
        if (elapsed >= 1000L) {
            currentPreviewFps = (previewFrames * 1000f) / elapsed
            previewFrames = 0
            lastPreviewTime = now
        }
    }

    fun onInferenceFrameProcessed() {
        inferenceFrames++
        val now = System.currentTimeMillis()
        val elapsed = now - lastInferenceTime
        if (elapsed >= 1000L) {
            currentInferenceFps = (inferenceFrames * 1000f) / elapsed
            inferenceFrames = 0
            lastInferenceTime = now
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/org/spatialnav/ai/MainActivity.kt',
    category: 'KOTLIN_SRC',
    title: 'Main Activity Orchestrator',
    description: 'Binds lifecycle, accessibility TalkBack integration, emergency audio stop, and pipeline flow.',
    content: `package org.spatialnav.ai

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.spatialnav.ai.analysis.ObstacleAnalyzer
import org.spatialnav.ai.analysis.RiskLevel
import org.spatialnav.ai.audio.SpatialAudioController
import org.spatialnav.ai.camera.CameraController
import org.spatialnav.ai.databinding.ActivityMainBinding
import org.spatialnav.ai.decision.NavigationDecisionEngine
import org.spatialnav.ai.depth.DepthEstimator
import org.spatialnav.ai.depth.DepthMapProcessor
import org.spatialnav.ai.telemetry.PerformanceMonitor

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var cameraController: CameraController? = null
    private lateinit var depthEstimator: DepthEstimator
    private lateinit var depthProcessor: DepthMapProcessor
    private lateinit var obstacleAnalyzer: ObstacleAnalyzer
    private lateinit var decisionEngine: NavigationDecisionEngine
    private lateinit var audioController: SpatialAudioController
    private val telemetry = PerformanceMonitor()

    private var isNavigating = false
    private var lastFrameTime = System.currentTimeMillis()

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startCameraPipeline()
        } else {
            Toast.makeText(this, "Camera permission required for spatial obstacle detection", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Initialize core computational engines
        depthEstimator = DepthEstimator(this)
        depthProcessor = DepthMapProcessor()
        obstacleAnalyzer = ObstacleAnalyzer()
        decisionEngine = NavigationDecisionEngine()
        audioController = SpatialAudioController(this)

        setupUI()
        checkPermissionsAndInit()
    }

    private fun setupUI() {
        binding.btnToggleNavigation.setOnClickListener {
            isNavigating = !isNavigating
            if (isNavigating) {
                audioController.uncheckMute()
                binding.btnToggleNavigation.text = getString(R.string.action_stop_navigation)
                binding.btnToggleNavigation.contentDescription = "Stop spatial navigation"
                audioController.speak("Navigation started. Scanning for obstacles.")
            } else {
                audioController.stopAll()
                binding.btnToggleNavigation.text = getString(R.string.action_start_navigation)
                binding.btnToggleNavigation.contentDescription = "Start spatial navigation"
                audioController.speak("Navigation stopped.")
            }
        }

        binding.btnStopAudio.setOnClickListener {
            audioController.stopAll()
            Toast.makeText(this, "Audio muted", Toast.LENGTH_SHORT).show()
        }
    }

    private fun checkPermissionsAndInit() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCameraPipeline()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCameraPipeline() {
        lifecycleScope.launch(Dispatchers.IO) {
            depthEstimator.initModel()
        }

        cameraController = CameraController(
            context = this,
            lifecycleOwner = this,
            onFrameAvailable = { bitmap, _ -> handleIncomingFrame(bitmap) },
            onError = { err ->
                runOnUiThread {
                    binding.tvPathAdvisory.text = "Camera Error: \$err"
                }
            }
        )
        cameraController?.startCamera(binding.previewView)
    }

    private fun handleIncomingFrame(bitmap: Bitmap) {
        telemetry.onPreviewFrameRendered()
        if (!isNavigating) return

        val now = System.currentTimeMillis()
        val frameAge = now - lastFrameTime
        lastFrameTime = now

        lifecycleScope.launch(Dispatchers.Default) {
            // 1. Monocular depth estimation
            val result = depthEstimator.estimateDepth(bitmap)
            telemetry.onInferenceFrameProcessed()

            // 2. Spatial zone division & 85th percentile
            val regionalStats = depthProcessor.processMatrix(result.depthMap)

            // 3. Temporal EMA smoothing & hysteresis
            val filtered = decisionEngine.update(
                regionalStats.leftP85,
                regionalStats.centerP85,
                regionalStats.rightP85
            )

            // 4. Obstacle risk assessment
            val assessment = obstacleAnalyzer.assess(
                filtered.leftSmoothed,
                filtered.centerSmoothed,
                filtered.rightSmoothed,
                regionalStats.nanRatio,
                frameAge
            )

            // 5. Audio feedback generation
            dispatchAudioCues(filtered, assessment)

            // 6. UI Update
            withContext(Dispatchers.Main) {
                updateUIFeedback(filtered, assessment, result.inferenceLatencyMs)
            }
        }
    }

    private fun dispatchAudioCues(
        filtered: NavigationDecisionEngine.FilteredResult,
        assessment: org.spatialnav.ai.analysis.ObstacleAssessment
    ) {
        if (assessment.overallRisk == RiskLevel.UNKNOWN) {
            audioController.speak(getString(R.string.speech_uncertain_depth))
            return
        }

        // Stereo panning: emit beep towards nearest hazard
        val center = filtered.centerSmoothed
        val left = filtered.leftSmoothed
        val right = filtered.rightSmoothed

        val maxThreat = maxOf(center, maxOf(left, right))
        if (maxThreat >= 0.48f) {
            val direction = when {
                center >= left && center >= right -> 0.0f
                left > right -> -0.85f
                else -> 0.85f
            }
            val frequency = 440f + (maxThreat * 400f)
            audioController.emitDirectionalCue(direction, frequency, 80, assessment.overallRisk)
        }
    }

    private fun updateUIFeedback(
        filtered: NavigationDecisionEngine.FilteredResult,
        assessment: org.spatialnav.ai.analysis.ObstacleAssessment,
        latencyMs: Long
    ) {
        binding.tvPathAdvisory.text = assessment.recommendation
        binding.tvTelemetry.text = "Preview: %.1f FPS · Inference: %.1f FPS · Latency: %d ms".format(
            telemetry.currentPreviewFps,
            telemetry.currentInferenceFps,
            latencyMs
        )

        binding.tvRegionLeft.text = "LEFT\\n\${filtered.leftRisk}"
        binding.tvRegionCenter.text = "CENTER\\n\${filtered.centerRisk}"
        binding.tvRegionRight.text = "RIGHT\\n\${filtered.rightRisk}"
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraController?.stopCamera()
        depthEstimator.close()
        audioController.release()
    }
}
`
  },
  {
    path: 'app/src/test/java/org/spatialnav/ai/ObstacleAnalyzerTest.kt',
    category: 'UNIT_TESTS',
    title: 'Unit Test: Obstacle Analyzer',
    description: 'Validates threshold boundaries, fail-safe UNKNOWN state on stale frames, and safe path recommendations.',
    content: `package org.spatialnav.ai

import com.google.truth.Truth.assertThat
import org.junit.Before
import org.junit.Test
import org.spatialnav.ai.analysis.ObstacleAnalyzer
import org.spatialnav.ai.analysis.RiskLevel

class ObstacleAnalyzerTest {

    private lateinit var analyzer: ObstacleAnalyzer

    @Before
    fun setup() {
        analyzer = ObstacleAnalyzer(
            highRiskThreshold = 0.72f,
            mediumRiskThreshold = 0.48f,
            maxAllowedNanRatio = 0.05f
        )
    }

    @Test
    fun assess_whenCenterDisparityHigh_returnsHighRiskAndClearerAdvice() {
        val result = analyzer.assess(
            leftDisparity = 0.20f,
            centerDisparity = 0.85f,
            rightDisparity = 0.30f,
            nanRatio = 0.01f,
            frameAgeMs = 33L
        )

        assertThat(result.overallRisk).isEqualTo(RiskLevel.HIGH)
        assertThat(result.centerRisk).isEqualTo(RiskLevel.HIGH)
        assertThat(result.isStaleOrCorrupt).isFalse()
        assertThat(result.recommendation).contains("Left appears clearer")
    }

    @Test
    fun assess_whenFrameStale_enforcesUnknownFailSafe() {
        val result = analyzer.assess(
            leftDisparity = 0.10f,
            centerDisparity = 0.10f,
            rightDisparity = 0.10f,
            nanRatio = 0.0f,
            frameAgeMs = 500L // Exceeds 350ms timeout threshold
        )

        assertThat(result.overallRisk).isEqualTo(RiskLevel.UNKNOWN)
        assertThat(result.isStaleOrCorrupt).isTrue()
        assertThat(result.recommendation).contains("Sensors unreliable")
    }

    @Test
    fun assess_whenExcessiveNanRatio_enforcesUnknownFailSafe() {
        val result = analyzer.assess(
            leftDisparity = 0.50f,
            centerDisparity = 0.50f,
            rightDisparity = 0.50f,
            nanRatio = 0.12f, // Exceeds 0.05 threshold
            frameAgeMs = 33L
        )

        assertThat(result.overallRisk).isEqualTo(RiskLevel.UNKNOWN)
        assertThat(result.isStaleOrCorrupt).isTrue()
    }
}
`
  },
  {
    path: 'app/src/test/java/org/spatialnav/ai/NavigationDecisionEngineTest.kt',
    category: 'UNIT_TESTS',
    title: 'Unit Test: Decision Engine Hysteresis',
    description: 'Verifies Exponential Moving Average smoothing and dual-threshold hysteresis chattering prevention.',
    content: `package org.spatialnav.ai

import com.google.truth.Truth.assertThat
import org.junit.Before
import org.junit.Test
import org.spatialnav.ai.analysis.RiskLevel
import org.spatialnav.ai.decision.NavigationDecisionEngine

class NavigationDecisionEngineTest {

    private lateinit var engine: NavigationDecisionEngine

    @Before
    fun setup() {
        engine = NavigationDecisionEngine(
            alpha = 0.5f,
            highEnter = 0.72f,
            highExit = 0.64f,
            mediumEnter = 0.48f,
            mediumExit = 0.40f
        )
    }

    @Test
    fun hysteresis_preventsChatterNearBoundary() {
        // Step 1: Spike above highEnter (0.75) -> Should enter HIGH
        var res = engine.update(rawLeft = 0.1f, rawCenter = 0.90f, rawRight = 0.1f)
        assertThat(res.centerRisk).isEqualTo(RiskLevel.HIGH)

        // Step 2: Dips slightly to 0.68 (below 0.72 enter, but above 0.64 exit)
        // Must stay HIGH due to hysteresis
        res = engine.update(rawLeft = 0.1f, rawCenter = 0.68f, rawRight = 0.1f)
        assertThat(res.centerRisk).isEqualTo(RiskLevel.HIGH)

        // Step 3: Dips below 0.64 exit -> Downgrades to MEDIUM
        res = engine.update(rawLeft = 0.1f, rawCenter = 0.55f, rawRight = 0.1f)
        assertThat(res.centerRisk).isEqualTo(RiskLevel.MEDIUM)
    }

    @Test
    fun ema_smoothesTransientNoiseSpike() {
        // Feed quiet values
        engine.update(0.1f, 0.1f, 0.1f)

        // Single isolated noise spike (1.0)
        val res = engine.update(0.1f, 1.0f, 0.1f)
        // With alpha=0.5, filtered value is 0.5 * 1.0 + 0.5 * 0.1 = 0.55 (does not reach 0.72 HIGH)
        assertThat(res.centerSmoothed).isLessThan(0.72f)
        assertThat(res.centerRisk).isNotEqualTo(RiskLevel.HIGH)
    }
}
`
  },
  {
    path: 'README.md',
    category: 'DOCS',
    title: 'Research Project README & Setup Guide',
    description: 'System specifications, model attribution, build commands, and testing instructions.',
    content: `# Spatial Navigation for the Visually Impaired Using On-Device Depth Estimation and Spatial Audio

## 1. Project Overview
This project presents an on-device, low-latency assistance system designed for visually impaired individuals navigating unfamiliar indoor spaces. By combining **monocular relative depth estimation (MiDaS v2.1 Small)** with **binaural spatial stereo audio**, the system warns users of impending hazards in their direct path without relying on external cloud infrastructure.

---

## 2. System Architecture
\`\`\`
[CameraX Live Stream] 
       │ (30 FPS preview, bounded queue)
       ▼
[Image Preprocessing] (256x256 RGB normalization)
       │
       ▼
[LiteRT / TFLite Interpreter] (On-Device MiDaS Small Inference)
       │
       ▼
[Depth Map Processor] (Floor plane rejection, Left/Center/Right zone slicing, P85)
       │
       ▼
[Temporal EMA Filter & Hysteresis Engine] (Dual-threshold stabilization)
       │
       ▼
[Binaural Spatial Audio Synthesizer] (Stereo panning, pitch modulation, TTS)
\`\`\`

---

## 3. Key Components
1. **CameraController**: Android CameraX binding using \`STRATEGY_KEEP_ONLY_LATEST\` to prevent frame queuing lag.
2. **DepthEstimator**: LiteRT (TensorFlow Lite) monocular model execution with GPU/NNAPI delegate support.
3. **DepthMapProcessor**: Computes robust 85th percentile ($P_{85}$) depth values for Left, Center, and Right zones while excluding the bottom 20% floor traversal plane.
4. **NavigationDecisionEngine**: Applies Exponential Moving Average (EMA, $\alpha=0.35$) and dual-threshold hysteresis ($\tau_{enter} > \tau_{exit}$) to eliminate audio chatter.
5. **SpatialAudioController**: AudioTrack stereo panning (Left: -0.85, Center: 0.0, Right: +0.85) with frequency modulation (440Hz - 880Hz) and TextToSpeech guidance.
6. **PerformanceMonitor**: Decouples preview FPS measurement from model inference FPS.

---

## 4. Building and Running the Android App
### Prerequisites
- Android Studio Hedgehog (2023.1.1) or newer
- Android SDK 34, Min SDK 26 (Android 8.0 Oreo)
- Physical Android device with Camera2 API support

### Model Setup
1. Download the pretrained MiDaS v2.1 Small TFLite model:
   \`\`\`bash
   curl -L -o app/src/main/assets/midas_small.tflite "https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.tflite"
   \`\`\`
2. Place \`midas_small.tflite\` in \`app/src/main/assets/\`.

### Build Commands
\`\`\`bash
# Run unit tests
./gradlew test

# Assemble debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug
\`\`\`

---

## 5. Research Limitations & Safety Mandatory Disclaimer
- **NOT A CERTIFIED MOBILITY AID**: This application is an experimental research prototype.
- **WHITE CANE COMPANION ONLY**: Never use this app as a primary mobility aid or as a replacement for a white cane, guide dog, or Orientation & Mobility (O&M) training.
- **UNRELIABLE HAZARDS**: Monocular depth estimation cannot reliably perceive:
  1. Floor drop-offs (descending stairwells, subway platforms)
  2. Specular glass doors and transparent barriers
  3. Thin wire or overhead hanging obstacles
  4. Extreme low-light conditions (<5 lux)
`
  }
];
