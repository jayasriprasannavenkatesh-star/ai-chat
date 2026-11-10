package com.prasanna.jarvis

import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.Locale

private const val BACKEND_URL = "https://jarvis-ai-backend-m0fe.onrender.com"

class MainActivity : ComponentActivity() {
    private var tts: TextToSpeech? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) tts?.language = Locale("en", "IN")
        }
        setContent { JarvisScreen(onSpeak = { speak(it) }) }
    }

    private fun speak(text: String) {
        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "jarvis_reply")
    }

    override fun onDestroy() {
        tts?.stop()
        tts?.shutdown()
        super.onDestroy()
    }
}

@Composable
private fun JarvisScreen(onSpeak: (String) -> Unit) {
    val messages = remember { mutableStateListOf<Pair<String, Boolean>>("Vanakkam! I am JARVIS. Ask me anything." to false) }
    var input by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var speakReplies by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()
    val client = remember { OkHttpClient() }

    val speechLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val spoken = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()
        if (!spoken.isNullOrBlank()) input = spoken
    }

    fun send() {
        val prompt = input.trim()
        if (prompt.isEmpty() || busy) return
        messages.add(prompt to true)
        input = ""
        busy = true
        scope.launch {
            try {
                val reply = withContext(Dispatchers.IO) {
                    val body = JSONObject().put("message", prompt)
                        .put("approvedMemory", "")
                        .put("history", org.json.JSONArray())
                        .toString()
                    val request = Request.Builder()
                        .url("$BACKEND_URL/chat")
                        .post(body.toRequestBody("application/json".toMediaType()))
                        .build()
                    client.newCall(request).execute().use { response ->
                        val responseText = response.body?.string().orEmpty()
                        if (!response.isSuccessful) throw Exception("Server error: ${response.code}")
                        JSONObject(responseText).optString("reply", "I could not get a reply.")
                    }
                }
                messages.add(reply to false)
                if (speakReplies) onSpeak(reply)
            } catch (e: Exception) {
                messages.add("I could not connect. Please check the backend setup and internet connection." to false)
            } finally { busy = false }
        }
    }

    MaterialTheme(colorScheme = darkColorScheme(
        primary = Color(0xFF5CC8FF),
        background = Color(0xFF080D18),
        surface = Color(0xFF111A2B)
    )) {
        Column(
            Modifier.fillMaxSize().background(Color(0xFF080D18)).padding(18.dp)
        ) {
            Text("J.A.R.V.I.S", color = Color(0xFF5CC8FF), fontSize = 27.sp)
            Text("PERSONAL AI ASSISTANT", color = Color.LightGray, fontSize = 11.sp)
            Spacer(Modifier.height(16.dp))
            LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(messages) { item ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement =
                        if (item.second) Arrangement.End else Arrangement.Start) {
                        Surface(
                            color = if (item.second) Color(0xFF123A55) else Color(0xFF172235),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text(item.first, color = Color.White, modifier = Modifier.padding(14.dp))
                        }
                    }
                }
                if (busy) item { Text("JARVIS is thinking…", color = Color(0xFF5CC8FF)) }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Switch(checked = speakReplies, onCheckedChange = { speakReplies = it })
                Text("Speak replies", color = Color.White, fontSize = 13.sp)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = input, onValueChange = { input = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Message JARVIS…") },
                    maxLines = 3
                )
                Spacer(Modifier.width(8.dp))
                IconButton(onClick = {
                    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                        putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ta-IN")
                        putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to JARVIS")
                    }
                    try { speechLauncher.launch(intent) } catch (_: Exception) {
                        messages.add("Speech recognition is not available on this device." to false)
                    }
                }) { Text("🎙", fontSize = 22.sp) }
                Button(onClick = { send() }, enabled = !busy && input.isNotBlank()) { Text("Send") }
            }
        }
    }
}
