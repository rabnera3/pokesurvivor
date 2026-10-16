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
    103: dict(name='Ahri', body='chibi', art='ahri', width=0.9, legs=1.1, legW=0.9,
              skin='fde0d6', hair='1f1c2a', hairStyle='long', eyes='1a1424',
              outfit='d03a5a', arms='d03a5a', hands='fde0d6', legsColor='f6f4fb', boots='a62240',
              fluffy=dict(color='f6f4fb', mid='d6d4e6', shadow='a6a2c0'),
              weapon=dict(kind='orb', color='6ab8ff', armOut=30), glow='ff9ad8',
              abil=dict(Q='throw', W='cast', E='throw', R='dash'),
              prestige=dict(weapon=dict(color='ffd060'), glow='ffe08a',
                            fluffy=dict(color='fff6e6', mid='f0dcb4', shadow='c8a878'))),
    157: dict(name='Yasuo', body='chibi', skin='c89a78', hair='3a2a22', hairStyle='ponytail',
              outfit='2c6a8c', outfit2='e8e0cc', arms='c89a78', legsColor='2a3448', boots='3a2a22', belt='e8e0cc', skirt='2c6a8c',
              weapon=dict(kind='katana', color='e8eef6', accent='3a2a22', grip=-25), glow='bfe8ff',
              headOrn=[dict(kind='band', color='c0b090')]),
}

# Los que ya están pulidos y entran en el juego (el resto sigue con el sprite repintado).
READY = {86, 103}
