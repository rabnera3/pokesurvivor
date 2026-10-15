"""Fichas de los campeones para doll.py (colores en hex, sin '#')."""

CHAMPS = {
    86: dict(name='Garen', body='chibi', art='garen', head=0.94, torso=1.0, legs=1.15, holdLen=9, width=1.15,
             skin='e8b48a', hair='6b4426', hairStyle='tufts', eyes='4a7ad0',
             outfit='24489a', arms='8a92a8', gauntlet='c4cad8', hands='c4cad8',
             legsColor='142456', boots='4a3426', pauldronSize=1.3,
             cape=dict(color='24489a', inner='d8a640', trim='d8a640', emblem='f6dc80'),
             weapon=dict(kind='greatsword', color='c4cad8', accent='d8a640', grip=-20, hold='across', len=19), glow='ffe9a0',
             abil=dict(Q='slam', W='guard', E='spin', R='ult'),
             prestige=dict(outfit='c4bcaa', legsColor='6a6458', boots='6a5030', glow='fff0a0',
                           cape=dict(color='ece6d6', inner='e8b030', trim='e8b030', emblem='e8b030'),
                           weapon=dict(color='f6d870', accent='ffffff', gem='3aa0f0'))),
    103: dict(name='Ahri', body='chibi', blush='f08aa0', hairLen=10, skin='f2c8a8', hair='2a2238', hairStyle='long', ears=dict(kind='fox', color='2a2238', inner='ff8ab8'),
              outfit='c8346e', outfit2='f4ece6', arms='f2c8a8', legsColor='f2c8a8', boots='c8346e', skirt='c8346e', chest='f4ece6',
              tails=dict(n=5, color='f4ece6', tip='ffd0e4', len=9, w=2.0), weapon=dict(kind='orb', color='7fb4ff'), glow='ff8ad8', eyes='d8a020'),
    157: dict(name='Yasuo', body='chibi', skin='c89a78', hair='3a2a22', hairStyle='ponytail',
              outfit='2c6a8c', outfit2='e8e0cc', arms='c89a78', legsColor='2a3448', boots='3a2a22', belt='e8e0cc', skirt='2c6a8c',
              weapon=dict(kind='katana', color='e8eef6', accent='3a2a22', grip=-25), glow='bfe8ff',
              headOrn=[dict(kind='band', color='c0b090')]),
}

# Los que ya están pulidos y entran en el juego (el resto sigue con el sprite repintado).
READY = {86}
