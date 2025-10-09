import struct


def pcm16_to_wav(pcm_bytes: bytes, sample_rate: int = 48000, channels: int = 1) -> bytes:
    """
    Wrap raw PCM16 little-endian mono data into a minimal WAV container.
    Returns WAV bytes suitable for browser playback.
    """
    bytes_per_sample = 2
    block_align = channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    data_size = len(pcm_bytes)
    riff_chunk_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",                # ChunkID
        riff_chunk_size,        # ChunkSize
        b"WAVE",                # Format
        b"fmt ",               # Subchunk1ID
        16,                     # Subchunk1Size (PCM)
        1,                      # AudioFormat (PCM = 1)
        channels,               # NumChannels
        sample_rate,            # SampleRate
        byte_rate,              # ByteRate
        block_align,            # BlockAlign
        16,                     # BitsPerSample
        b"data",               # Subchunk2ID
        data_size               # Subchunk2Size
    )

    return header + pcm_bytes


